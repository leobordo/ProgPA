# Ultralytics YOLO 🚀, AGPL-3.0 license

from copy import copy

import numpy as np
import torch
import torch.nn as nn  # Fixme: added for downsampling HR imgs
import matplotlib.pyplot as plt

from ultralytics.data import build_dataloader, build_yolo_dataset
from ultralytics.engine.trainer import BaseTrainer
from ultralytics.models import yolo
from ultralytics.nn.tasks import DetectionModel
from ultralytics.utils import LOGGER, RANK
from ultralytics.utils.plotting import plot_images, plot_labels, plot_results
from ultralytics.utils.torch_utils import de_parallel, torch_distributed_zero_first
from ultralytics.data.utils import polygon2mask  # Fixme: added for SR segmentation mask creation


class DetectionTrainer(BaseTrainer):
    """
    A class extending the BaseTrainer class for training based on a detection model.

    Example:
        ```python
        from ultralytics.models.yolo.detect import DetectionTrainer

        args = dict(model='yolov8n.pt', data='coco8.yaml', epochs=3)
        trainer = DetectionTrainer(overrides=args)
        trainer.train()
        ```
    """

    def build_dataset(self, img_path, mode='train', batch=None):
        """
        Build YOLO Dataset.

        Args:
            img_path (str): Path to the folder containing images.
            mode (str): `train` mode or `val` mode, users are able to customize different augmentations for each mode.
            batch (int, optional): Size of batches, this is for `rect`. Defaults to None.
        """
        gs = max(int(de_parallel(self.model).stride.max() if self.model else 0), 32)
        return build_yolo_dataset(self.args, img_path, batch, self.data, mode=mode, rect=mode == 'val', stride=gs)

    def get_dataloader(self, dataset_path, batch_size=16, rank=0, mode='train'):
        """Construct and return dataloader."""
        assert mode in ['train', 'val']
        with torch_distributed_zero_first(rank):  # init dataset *.cache only once if DDP
            dataset = self.build_dataset(dataset_path, mode, batch_size)
        shuffle = mode == 'train'
        if getattr(dataset, 'rect', False) and shuffle:
            LOGGER.warning("WARNING ⚠️ 'rect=True' is incompatible with DataLoader shuffle, setting shuffle=False")
            shuffle = False
        workers = self.args.workers if mode == 'train' else self.args.workers * 2
        return build_dataloader(dataset, batch_size, workers, shuffle, rank)  # return dataloader

    def preprocess_batch(self, batch):
        """Preprocesses a batch of images by scaling and converting to float."""
        # Fixme: added LR images creation for SR
        if self.sr and (self.factor > 1):
            batch['hr_img'] = batch['img'].to(self.device, non_blocking=True).float() / 255
            batch['img'] = nn.functional.interpolate(batch['hr_img'],
                                             size=[i // self.factor for i in batch['hr_img'].size()[2:]],
                                             mode='bilinear',
                                             align_corners=True)
            # Fixme: Apply preprocessing to generate hr_img_masks for batch to weight SR loss
            if self.args.focal_sr:
                # Get high-resolution image size
                h, w = batch['hr_img'].size()[2:]
                # Create empty segment tensor of form [[x_min, y_min], [x_max, y_min], [x_max, y_max], [x_min, y_max]]
                segment = torch.empty(batch['bboxes'].shape + (2,), dtype=torch.int32)
                # Compute [x_min, y_min] and de-normalize
                segment[:, [0], 0] = ((batch['bboxes'][:, [0]] - (batch['bboxes'][:, [2]] / 2)) * w).int()
                segment[:, [0], 1] = ((batch['bboxes'][:, [1]] - (batch['bboxes'][:, [3]] / 2)) * h).int()
                # Compute [x_max, y_min] and de-normalize
                segment[:, [1], 0] = ((batch['bboxes'][:, [0]] + (batch['bboxes'][:, [2]] / 2)) * w).int()
                segment[:, [1], 1] = ((batch['bboxes'][:, [1]] - (batch['bboxes'][:, [3]] / 2)) * h).int()
                # Compute [x_max, y_max] and de-normalize
                segment[:, [2], 0] = ((batch['bboxes'][:, [0]] + (batch['bboxes'][:, [2]] / 2)) * w).int()
                segment[:, [2], 1] = ((batch['bboxes'][:, [1]] + (batch['bboxes'][:, [3]] / 2)) * h).int()
                # Compute [x_min, y_max] and de-normalize
                segment[:, [3], 0] = ((batch['bboxes'][:, [0]] - (batch['bboxes'][:, [2]] / 2)) * w).int()
                segment[:, [3], 1] = ((batch['bboxes'][:, [1]] + (batch['bboxes'][:, [3]] / 2)) * h).int()

                # Count bboxes per image
                count = torch.bincount(batch['batch_idx'].int(), minlength=batch['hr_img'].size()[0])
                # Split segment in B chunks
                chunks = torch.split(segment, count.tolist())
                # Create list of B imgszs
                imgszs = [batch['hr_img'].size()[2:]] * batch['hr_img'].size()[0]
                # Create binary mask for each chunk (polygon2mask) applying lambda function to handle empty images
                out = np.array(list(map(lambda x,y: np.zeros(x, dtype=np.uint8) if y.nelement() == 0 else polygon2mask(x,y), imgszs, chunks)))

                # Logarithmic smoothing
                # Parameters: 
                # - logarithm base
                # - multiplicative factor of the argument of the logarithm
                # - mask coefficients outside the bounding boxes
                # - weight of the focal_sr loss
                out = out * ((np.log((self.args.molt_arg*w*h / (np.sum(out, axis=(1, 2))[:, np.newaxis, np.newaxis] + 1e-10))))/np.log(self.args.logb)) + self.args.add_fact

                #FIXED COEFFICIENT
                # out = out * 6 + 0.8
                # Apply mask weights' no smoothing ! ALTERNATIVE TO  logarithmic smoothing (/100 e max 200)
                #out = out * ((w*h) / (np.sum(out, axis=(1, 2))[:, np.newaxis, np.newaxis] + 1e-10)) + 1

                # NO SMOOTHING WITH UPPER BOUND
                # coefficient = (w*h/100) / (np.sum(out, axis=(1, 2))[:, np.newaxis, np.newaxis] + 1e-10)
                # limited_coefficient = np.where(coefficient > 40, 40, coefficient)
                # out = out * limited_coefficient + self.args.add_fact

                # OLD SMOOTHING
                # Apply mask weights' logarithmic smoothing              
                # out = out * np.log(w*h/np.sum(out)) + 1
                
                # Add new dimension to apply broadcasting for RGB images and assign to batch
                batch['hr_img_mask'] = torch.from_numpy(out[:, np.newaxis, :, :]).to(self.device, non_blocking=True)

        else:
            batch['img'] = batch['img'].to(self.device, non_blocking=True).float() / 255
        return batch

    def set_model_attributes(self):
        """nl = de_parallel(self.model).model[-1].nl  # number of detection layers (to scale hyps)."""
        # self.args.box *= 3 / nl  # scale to layers
        # self.args.cls *= self.data["nc"] / 80 * 3 / nl  # scale to classes and layers
        # self.args.cls *= (self.args.imgsz / 640) ** 2 * 3 / nl  # scale to image size and layers
        self.model.nc = self.data['nc']  # attach number of classes to model
        self.model.names = self.data['names']  # attach class names to model
        self.model.args = self.args  # attach hyperparameters to model
        # TODO: self.model.class_weights = labels_to_class_weights(dataset.labels, nc).to(device) * nc

    def get_model(self, cfg=None, weights=None, verbose=True):
        """Return a YOLO detection model."""
        # Fixme: Add sr and factor params
        model = DetectionModel(cfg, nc=self.data['nc'], verbose=verbose and RANK == -1, sr=self.args.sr, focal_sr=self.args.focal_sr, factor=self.args.factor)
        if weights:
            model.load(weights)
        return model

    def get_validator(self):
        """Returns a DetectionValidator for YOLO model validation."""
        self.loss_names = 'box_loss', 'cls_loss', 'dfl_loss'
        return yolo.detect.DetectionValidator(self.test_loader, save_dir=self.save_dir, args=copy(self.args))

    def label_loss_items(self, loss_items=None, prefix='train'):
        """
        Returns a loss dict with labelled training loss items tensor. Not needed for classification but necessary for
        segmentation & detection
        """
        # Fixme: Add sr loss name for training only
        if self.sr and prefix == 'train':
            keys = [f'{prefix}/{x}' for x in self.loss_names + ('sr_loss',)]
        else:
            keys = [f'{prefix}/{x}' for x in self.loss_names]
        # keys = [f'{prefix}/{x}' for x in self.loss_names]
        if loss_items is not None:
            loss_items = [round(float(x), 5) for x in loss_items]  # convert tensors to 5 decimal place floats
            return dict(zip(keys, loss_items))
        else:
            return keys

    def progress_string(self):
        """Returns a formatted string of training progress with epoch, GPU memory, loss, instances and size."""
        # Fixme: added SR loss visualization
        if self.sr:
            return ('\n' + '%11s' *
                    (4 + len(self.loss_names + ('sr_loss',)))) % ('Epoch', 'GPU_mem', *self.loss_names + ('sr_loss',), 'Instances', 'Size')
        else:
            return ('\n' + '%11s' *
                    (4 + len(self.loss_names))) % ('Epoch', 'GPU_mem', *self.loss_names, 'Instances', 'Size')

    def plot_training_samples(self, batch, ni):
        """Plots training samples with their annotations."""
        plot_images(images=batch['img'],
                    batch_idx=batch['batch_idx'],
                    cls=batch['cls'].squeeze(-1),
                    bboxes=batch['bboxes'],
                    paths=batch['im_file'],
                    fname=self.save_dir / f'train_batch{ni}.jpg',
                    on_plot=self.on_plot)

    def plot_metrics(self):
        """Plots metrics from a CSV file."""
        plot_results(file=self.csv, on_plot=self.on_plot)  # save results.png

    def plot_training_labels(self):
        """Create a labeled training plot of the YOLO model."""
        boxes = np.concatenate([lb['bboxes'] for lb in self.train_loader.dataset.labels], 0)
        cls = np.concatenate([lb['cls'] for lb in self.train_loader.dataset.labels], 0)
        plot_labels(boxes, cls.squeeze(), names=self.data['names'], save_dir=self.save_dir, on_plot=self.on_plot)
