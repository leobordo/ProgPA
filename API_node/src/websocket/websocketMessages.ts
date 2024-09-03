/**
 * @fileoverview WebSocket Message Handling Module
 * 
 * This module is responsible for defining and managing WebSocket messages for the application.
 * It includes:
 * - Enumeration of different types of WebSocket messages (`MessageType`).
 * - Interfaces that define the structure of message parameters.
 * - Templates for formatting messages based on their type.
 * - A function to send formatted messages to users via WebSocket.
 *
 * The module ensures that all messages sent over WebSocket are correctly formatted and sent
 * according to the user's actions or job statuses. It is designed to be easily extensible for
 * adding new message types or modifying existing templates.
 */

import { sendMessageToUser } from './websocketServer';

// Enum representing different types of WebSocket messages
export enum MessageType {
    Welcome = 'welcome', 
    JobList = 'job_list',
    JobActive = 'job_active',
    JobCompleted = 'job_completed',
    JobFailed = 'job_failed',
    JobAborted = 'job_aborted',
  }

// Interface that defines the structure for message templates
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

//Interfaces that defines the structures for different types of message

interface JobMessageParams {
    userEmail: string;
    jobId: string;
}

interface WelcomeMessageParams {
    userEmail: string;
}

/**
 * Sends a formatted message to a specific user via WebSocket.
 *
 * This function generates a message based on the provided type and parameters,
 * formats it using the appropriate template, and sends it to the user via their WebSocket connection.
 *
 * @param {string} userEmail - The email of the user to whom the message is being sent.
 * @param {MessageType} type - The type of message to be sent (e.g., welcome, job update).
 * @param {JobMessageParams | WelcomeMessageParams} params - The parameters required for formatting the message.
 */
export const sendUserMessage = (userEmail: string, type: MessageType, params: JobMessageParams | WelcomeMessageParams) => {
    try {

      // Generate the message using the corresponding template function based on the type
      const message = messageTemplates[type](params);
      
      // Wrap the message in an object to be sent over WebSocket
      const messageToSend: any = { message };
      
      // Send the formatted message to the specified user using WebSocket
      sendMessageToUser(userEmail, messageToSend);
    } catch (error) {

      // Log an error if message generation or sending fails
      console.error(`Error sending message of type ${type} to user ${userEmail}:`, error);
    }
  };
  