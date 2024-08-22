enum JobStatus {
    Pending = "Pending",
    Running = "Running",
    Completed = "Completed",
    Failed = "Failed",
    Aborted = "Aborted"
}

interface IJsonResult {

}

interface IResult {
    jsonResult: IJsonResult;
    contentURI: string;
}

export {JobStatus, IResult}