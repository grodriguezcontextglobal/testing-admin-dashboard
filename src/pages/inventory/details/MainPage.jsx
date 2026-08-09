/**
 * Route entry for a single device.
 *
 * The page itself moved to ./deviceProfile, rebuilt on the same ProfileShell
 * the consumer and member pages use. Two things that lived here are gone on
 * purpose: the "Search devices here" box, which was registered to react-hook-form
 * and wired to nothing on a page about one device, and the "Add new group of
 * devices" button, which was the inventory *list* page's primary action
 * inherited onto a detail page. The device's own primary action — assign it —
 * takes that slot.
 */
import DeviceProfilePage from "./deviceProfile/DeviceProfilePage";

const MainPage = () => <DeviceProfilePage />;

export default MainPage;
