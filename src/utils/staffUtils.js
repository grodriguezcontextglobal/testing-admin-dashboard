/**
 * Utility functions for managing staff data.
 */

/**
 * Updates a specific staff member in an array of employees.
 * This function returns a new array with the updated staff member data, preserving immutability.
 *
 * @param {Array} employeesArray - The array of employee objects.
 * @param {Object} staffMemberToUpdate - The staff member object containing updated data. 
 *                                       Must have a unique identifier (e.g., 'user' email or 'id') 
 *                                       that matches an entry in employeesArray.
 * @param {string} identifierKey - The key to use for identifying the staff member (default: 'user').
 * @returns {Array} A new array with the updated staff member, or the original array if not found.
 */
export const updateStaffMemberInList = (employeesArray, staffMemberToUpdate, identifierKey = 'user') => {
    if (!Array.isArray(employeesArray)) {
        console.warn('updateStaffMemberInList: employeesArray provided is not an array.');
        return [];
    }

    if (!staffMemberToUpdate || typeof staffMemberToUpdate !== 'object') {
        console.warn('updateStaffMemberInList: staffMemberToUpdate provided is invalid.');
        return employeesArray;
    }

    const index = employeesArray.findIndex(
        (employee) => employee[identifierKey] === staffMemberToUpdate[identifierKey]
    );

    if (index === -1) {
        console.warn(`updateStaffMemberInList: Staff member with ${identifierKey} "${staffMemberToUpdate[identifierKey]}" not found.`);
        return employeesArray;
    }

    // Create a shallow copy of the array
    const newEmployeesArray = [...employeesArray];
    
    // Update the specific item, merging existing data with new data
    newEmployeesArray[index] = {
        ...newEmployeesArray[index],
        ...staffMemberToUpdate,
    };

    return newEmployeesArray;
};
