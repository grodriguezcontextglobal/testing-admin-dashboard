import { useLocation } from "react-router-dom"
import ContactInfo from "./updateContactComponents/ContactInfo"

const UpdateContactInfo = () => {
    const location = useLocation()
    return <div key={location.key}>
        <ContactInfo />
    </div>
}

export default UpdateContactInfo