import { sendMessageToUser } from './websocketServer';


export enum MessageType {
    Welcome = 'welcome',
    JobList = 'job_list',
    JobActive = 'job_active',
    JobCompleted = 'job_completed',
    JobFailed = 'job_failed',
    JobAborted = 'job_aborted',
  }


  interface MessageTemplates {
    [key: string]: (params: any) => string;
  }
  
  export const messageTemplates: MessageTemplates = {
    [MessageType.Welcome]: ({ userEmail }: { userEmail: string }) => 
      `Hello, ${userEmail}! Welcome to the Job Monitoring System. You can monitor your job statuses in real-time.`,
  
    [MessageType.JobActive]: ({ userEmail, jobId }: { userEmail: string, jobId: string }) => 
      `${userEmail}, your job with ID ${jobId} has been taken in charge.`,
  
    [MessageType.JobCompleted]: ({ userEmail, jobId }: { userEmail: string, jobId: string }) => 
      `${userEmail}, your job with ID ${jobId} has been completed.`,
  
    [MessageType.JobFailed]: ({ userEmail, jobId }: { userEmail: string, jobId: string }) => 
      `${userEmail}, your job with ID ${jobId} has failed.`,
  
    [MessageType.JobAborted]: ({ userEmail, jobId }: { userEmail: string, jobId: string }) => 
      `${userEmail}, your job with ID ${jobId} was aborted due to insufficient tokens.`,
    
    [MessageType.JobList]: ({ userEmail }: { userEmail: string }) => 
      `Here is a list of the jobs associated with your account (${userEmail}).`,

  };
  


interface JobMessageParams {
    userEmail: string;
    jobId: string;
}

interface WelcomeMessageParams {
    userEmail: string;
}



 // Sends a message to a user via WebSocket.


export const sendUserMessage = (userEmail: string, type: MessageType, params: JobMessageParams | WelcomeMessageParams) => {
    try {
      const message = messageTemplates[type](params);
      
      const messageToSend: any = { message };
      
      sendMessageToUser(userEmail, messageToSend);
    } catch (error) {
      console.error(`Error sending message of type ${type} to user ${userEmail}:`, error);
    }
  };
  