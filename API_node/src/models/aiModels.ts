/**
 * @fileOverview Object Detection Model Identifiers and Versions.
 *
 * This module defines enumerations for available object detection models and their versions.
 * These enumerations are used throughout the application to specify the model type and version
 * being used for object detection tasks.
 */

/**
 * Enumeration of available object detection models.
 *
 * @enum {string}
 */
enum ModelId {
    YoloV8 = "YOLO8"
}

/**
 * Enumeration of available versions for the YOLOv8 model.
 *
 * @enum {string}
 */
enum Yolov8Version {
    Small = "YOLO8s_FSR",
    Medium = "YOLO8m_FSR",
}

// Export the enumerations for use in other modules
export {ModelId, Yolov8Version};

