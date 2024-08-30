"""
This module defines the models and functions used for processing files with YOLO models.

Constants:
    model_dict (dict): A dictionary of YOLO models and their versions.
    ACCEPTED_MIME_TYPES (dict): A dictionary of accepted MIME types for images and videos.

Functions:
    get_file_category(file_path): Determines the category of a file based on its MIME type.
"""
import mimetypes
from ultralytics.models.yolo.model import YOLO

# Dictionary of YOLO models and their versions
model_dict = {
    'YOLO8': {
        'YOLO8s_FSR': YOLO('./YOLO/ultralytics/yolo8s_focalsr.pt'),
        'YOLO8m_FSR': YOLO('./YOLO/ultralytics/yolo8m_focalsr.pt'),
    }    
}

ACCEPTED_MIME_TYPES = {
    'image': [
        'image/bmp',                    # .bmp
        'image/x-ms-bmp',               # alternative MIME for BMP
        'image/x-adobe-dng',            # .dng (not a standard MIME, added for custom use)
        'image/jpeg',                   # .jpeg, .jpg
        'image/mpo',                    # .mpo (not a standard MIME, added for custom use)
        'image/png',                    # .png
        'image/tiff',                   # .tif, .tiff
        'image/webp',                   # .webp
        'image/x-portable-floatmap',    # .pfm (not a standard MIME, added for custom use)
    ],
    'video': [
        'video/x-ms-asf',     # .asf
        'video/x-msvideo',    # .avi
        'image/gif',          # .gif (considered as both image and video format)
        'video/x-m4v',        # .m4v
        'video/x-matroska',   # .mkv
        'video/quicktime',    # .mov
        'video/mp4',          # .mp4
        'video/mpeg',         # .mpeg, .mpg
        'video/mp2t',         # .ts
        'video/x-ms-wmv',     # .wmv
        'video/webm',         # .webm
    ],
}

def get_file_category(file_path):
    
    """
    Determines the category of a file based on its MIME type.

    Args:
        file_path (str): The path to the file for which the category is to be determined.

    Returns:
        str: The category of the file ('image', 'video') if recognized, otherwise None.
    """

    # Guess the MIME type of the file

    mime = mimetypes.guess_type(file_path)[0]

    # Check if the MIME type is recognized and return the category
    if mime:
        for category, types in ACCEPTED_MIME_TYPES.items():
            if mime in types:
                return category
    
    # Return None if the MIME type does not match any accepted types
    return None
