/**
 * @fileOverview Job Status Enumerations and Result Interface.
 *
 * This module defines enumerations for job statuses used in the application, both for general 
 * job processing states and specific BullMQ job states. Additionally, it defines an interface for 
 * job results, encapsulating the JSON result and the content URI.
 */

/**
 * Enumeration of general job statuses.
 *
 * This enum represents the possible states of a job within the application, 
 * from submission to completion or failure.
 *
 * @enum {string}
 */
enum JobStatus {
    Pending = "Pending",
    Running = "Running",
    Completed = "Completed",
    Failed = "Failed",
    Aborted = "Aborted"
}

/**
 * Enumeration of BullMQ job statuses.
 *
 * This enum represents the various states a job can have within the BullMQ job queue system.
 *
 * @enum {string}
 */
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

/**
 * Interface for representing the result of a job.
 *
 * This interface defines the structure of a job result, including the JSON result object and the content URI.
 *
 * @interface
 */
interface IResult {
    jsonResult: Object;
    contentURI: string;
}

export {JobStatus, IResult, BullJobStatus}