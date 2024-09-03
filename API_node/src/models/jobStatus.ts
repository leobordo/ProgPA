enum JobStatus {
    Pending = "Pending",
    Running = "Running",
    Completed = "Completed",
    Failed = "Failed",
    Aborted = "Aborted"
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

interface IResult {
    jsonResult: Object;
    contentURI: string;
}

export {JobStatus, IResult, BullJobStatus}