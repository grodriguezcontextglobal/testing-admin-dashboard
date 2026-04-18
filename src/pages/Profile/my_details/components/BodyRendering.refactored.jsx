import dicRole from "../../../../components/general/dicRole";
import ImageUploaderUX from "../../../../components/utils/UX/ImageUploaderUX";
import Chip from "../../../../components/UX/Chip/Chip";
import Input from "../../../../components/UX/inputs/Input";
import "./BodyRendering.css";

const BodyRendering = ({
  handleSubmit,
  handleUpdatePersonalInfo,
  listOfEvents,
  loading,
  register,
  setImageUploadedValue,
  user,
  removeUploadedProfileImage,
}) => {
  return (
    <form className="profile-form" onSubmit={handleSubmit(handleUpdatePersonalInfo)}>
      <div className="profile-form__header">
        <div className="profile-form__header-copy">
          <h1 className="profile-form__title">Personal Info</h1>
          <p className="profile-form__description">
            Update your photo and personal details.
          </p>
        </div>
        <div className="profile-form__actions">
          <button type="button" className="btn btn--secondary">
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn--primary"
            disabled={loading}
          >
            Save
          </button>
        </div>
      </div>
      <div className="profile-form__content">
        <div className="form-row">
          <div className="form-row__label">
            <h2 className="form-row__title">Name</h2>
          </div>
          <div className="form-row__content form-row__content--split">
            <div className="field-group">
              <label htmlFor="name" className="field-group__mobile-label">
                First name
              </label>
              <Input
                type="text"
                id="name"
                {...register("name", { required: true })}
                className="input"
                placeholder="Enter your first name"
              />
            </div>
            <div className="field-group">
              <label htmlFor="lastName" className="field-group__mobile-label">
                Last name
              </label>
              <Input
                type="text"
                id="lastName"
                {...register("lastName", { required: true })}
                className="input"
                placeholder="Enter your last name"
              />
            </div>
          </div>
        </div>
        <hr className="form-divider" />
        <div className="form-row">
          <div className="form-row__label">
            <h2 className="form-row__title">Email address</h2>
          </div>
          <div className="form-row__content">
            <div className="field-group">
              <Input
                type="email"
                id="email"
                {...register("email", { required: true })}
                className="input"
                placeholder="Enter your email"
              />
            </div>
          </div>
        </div>
        <hr className="form-divider" />
        <div className="form-row">
          <div className="form-row__label">
            <h2 className="form-row__title">Your photo</h2>
            <p className="form-row__hint">
              This will be displayed on your profile.
            </p>
          </div>
          <div className="form-row__content">
            <div className="photo-section">
              <div className="photo-section__preview">
                {user?.data?.imageProfile ? (
                  <img
                    src={user.data.imageProfile}
                    alt="Profile"
                    className="photo-section__image"
                  />
                ) : (
                  <div className="photo-section__placeholder">
                    <span>
                      {user?.name?.[0]}
                      {user?.lastName?.[0]}
                    </span>
                  </div>
                )}
                <button
                  type="button"
                  className="btn btn--secondary"
                  onClick={removeUploadedProfileImage}
                >
                  Remove
                </button>
              </div>
              <div className="photo-section__uploader">
                <ImageUploaderUX
                  setImageUploadedValue={setImageUploadedValue}
                />
              </div>
            </div>
          </div>
        </div>
        <hr className="form-divider" />
        <div className="form-row">
          <div className="form-row__label">
            <h2 className="form-row__title">Role</h2>
          </div>
          <div className="form-row__content">
            <div className="field-group">
              <Input
                type="text"
                id="role"
                value={dicRole[Number(user.role)]}
                readOnly
                className="input input--readonly"
              />
            </div>
          </div>
        </div>
        <hr className="form-divider" />
        <div className="form-row">
          <div className="form-row__label">
            <h2 className="form-row__title">Events</h2>
            <p className="form-row__hint">
              A list of events you are associated with.
            </p>
          </div>
          <div className="form-row__content">
            <div className="event-tags">
              {listOfEvents().length > 0 ? (
                listOfEvents().map((event) => (
                  <Chip
                    key={event?.eventInfoDetail?.eventName}
                    label={event?.eventInfoDetail?.eventName}
                  />
                ))
              ) : (
                <p className="empty-text">No events found.</p>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="profile-form__footer">
        <button type="button" className="btn btn--secondary">
          Cancel
        </button>
        <button
          type="submit"
          className="btn btn--primary"
          disabled={loading}
        >
          Save
        </button>
      </div>
    </form>
  );
};

export default BodyRendering;
