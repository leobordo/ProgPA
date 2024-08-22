// Check if the tokens owned by the specified user (by email) are sufficient to perform the requested operation
const checkTokenAvailability = async (user: string, tokenCost: number): Promise<boolean> => {
    const tokenBalance = 123 //chiamata ad una funzione del dao che recupera il numero di token dell'utente
    if (tokenBalance - tokenCost >= 0) {
        return true;
    }
    return false;
};

// Update the token balance of the specified user (by email) adding the specified top-up amount
// Return the amount of the user's new token balance 
const updateTokenBalance = async (user: string, topUpAmount: number): Promise<number> => {
    //const previousBalance = chiamata ad una funzione del dao che recupera il numero di token dell'utente
    //const newBalance = previousBalance + topUpAmount;
    //chiamata ad una funzione del dao per aggiornare il numero di token dell'utente
    //return newBalance
    return 0;
};

// Adds the job to the queue and returns its ID which can be used later to check the job status and/or retrieve its result
const getTokenBalance = async (user: string): Promise<number> => {
    // return ... chiamata alla funzione del dao per recuperare il credito dell'utente
    return 0;
};

export {checkTokenAvailability, updateTokenBalance, getTokenBalance};