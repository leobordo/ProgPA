enum JobStatus {
    Pending = "pending",
    Running = "running",
    Completed = "completed",
    Failed = "failed",
    Aborted = "aborted"
}

enum BullJobStatus {
    Waiting = "waiting",
    Completed = "completed",
    Delayed = "delayed",
    Active = "active",
    WaitingChildren = "waiting-children",
    Prioritized = "prioritized",
    Failed = "failed",
    Removed = "removed"
}

/*
enum IContentType {
    Image = "image",
    Video = "video"
}*/

interface IJsonResult {
    type: string,
    filename: string,
    objects?: Array<IObject>,
    frames?: Array<IFrame>
}

interface IFrame {
    frame_number: number,
    time: number,
    objects: Array<IObject>
}

interface IObject {
    name: string,
    class: number,
    confidence: number,
    box: IBoundingBox
}

interface IBoundingBox {
    x1: number,
    y1: number,
    x2: number,
    y2: number
}

interface IResult {
    jsonResult: any;
    //jsonResult: Array<IJsonResult>;
    contentURI: string;
}

export {JobStatus, IResult, BullJobStatus}