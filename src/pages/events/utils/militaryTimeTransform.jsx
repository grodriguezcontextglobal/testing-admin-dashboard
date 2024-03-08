const convertMilitaryToRegularTime = (militaryTime) => {
        const time = new Date(militaryTime);
        let hours = time.getHours();
        let minutes = time.getMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12; // Handle midnight (0 hours)
        minutes = minutes < 10 ? '0' + minutes : minutes; // Ensure minutes are two digits
        const regularTime = hours + ':' + minutes + ' ' + ampm;
        return regularTime;
}

export default convertMilitaryToRegularTime