const getTrialEndDate = () => {
    // Get today's date
    const today = new Date();
    
    // Add 30 days to today's date
    const trialEndDate = new Date(today);
    trialEndDate.setDate(today.getDate() + 30);
  
    // Format the date as YYYY-MM-DD
    const year = trialEndDate.getFullYear();
    const month = String(trialEndDate.getMonth() + 1).padStart(2, '0'); // Months are zero-indexed
    const day = String(trialEndDate.getDate()).padStart(2, '0');
  
    return `${year}-${month}-${day}`;
  }
  
  export default getTrialEndDate