
import { Controller } from "react-hook-form";
import { Avatar, AutoComplete } from "antd";
import { Icon } from "@iconify/react/dist/iconify.js";
import SectionLabel from "../../../../components/documents/new_form_components/SectionLabel";
import { CompanyIcon } from "../../../../components/icons/CompanyIcon";
import CardSearchStaffFound from "../../../search/utils/CardSearchStaffFound";
import "./CompanyInfo.css";

const BodyFormRefactored = ({
  checkIfOriginalDataHasChange,
  control,
  feature,
  industryListOptions,
  register,
  removingCompanyLogo,
  user,
}) => {
  const renderInput = () => {
    if (feature && feature?.object) {
      return (
        <div className="form-grid-two-cols" style={{ gap: '1rem' }}>
          {feature.children.map((child) => (
            <div className="form-field" key={child?.name}>
              <label className="form-field__label form-field__label--hidden-lg">{child?.name}</label>
              {checkIfOriginalDataHasChange(child?.name)}
              <div className="input-base">
                <input {...register(child?.name)} className="input-base__input" placeholder={child?.name.charAt(0).toUpperCase() + child?.name.slice(1)} />
              </div>
            </div>
          ))}
        </div>
      );
    } else if (feature && feature?.logo) {
        return (
            <div className="photo-section">
            {String(user.companyData.company_logo).length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: 'center' }}>
                <Avatar size={100} src={<img src={user?.companyData?.company_logo} alt="company_logo" />} />
                <button
                  type="button"
                  onClick={() => removingCompanyLogo()}
                  style={{
                    backgroundColor: "transparent",
                    border: "none",
                    outline: "none",
                    margin: 0,
                    padding: 0,
                    cursor: 'pointer'
                  }}
                >
                  <p style={{ textDecoration: "underline", color: "var(--danger-action)" }}>
                    Remove
                  </p>
                </button>
              </div>
            ) : (
              <Avatar style={{ padding: "40px" }}>
                <CompanyIcon />
              </Avatar>
            )}
            <div className="file-upload-dropzone">
                <div className="file-upload-dropzone__icon-wrapper">
                    <Icon icon="tabler:cloud-upload" color="#475467" width={20} height={20} />
                </div>
                <div className="file-upload-dropzone__text-group">
                    <label htmlFor="file-upload" className="file-upload-dropzone__cta">
                        Click to upload
                    </label>
                    <p className="file-upload-dropzone__hint">SVG, PNG, JPG or GIF (max. 1MB)</p>
                    <input {...register('companyLogo')} id="file-upload" type="file" accept=".jpeg, .png, .jpg" style={{ display: 'none' }} />
                </div>
            </div>
          </div>
        )
    } else if (feature && feature?.array) {
        return (
            <details className="employees-details">
                <summary className="employees-summary">Employees</summary>
                <div className="employees-grid">
                    {user.companyData.employees.map((employee) => (
                    <CardSearchStaffFound
                        key={employee.user}
                        props={{
                        status: employee.status,
                        name: employee.firstName,
                        lastName: employee.lastName,
                        email: employee.user,
                        phoneNumber: "",
                        }}
                        fn={null}
                    />
                    ))}
                </div>
            </details>
        )
    } else if (feature && feature?.name === 'industry') {
        return (
            <Controller
              control={control}
              name="industry"
              render={({ field: { value, onChange } }) => (
                <AutoComplete
                  style={{
                    width: "100%",
                    height: "44px",
                    display: "flex",
                    alignItems: "center",
                  }}
                  value={value}
                  onChange={(val) => onChange(val)}
                  options={industryListOptions?.map((opt) => ({
                    value: String(opt),
                    label: <span style={{ textTransform: "capitalize" }}>{opt}</span>,
                  }))}
                  placeholder="Type your industry area"
                  filterOption={(inputValue, option) =>
                    String(option?.value)
                      .toLowerCase()
                      .includes(String(inputValue).toLowerCase())
                  }
                  allowClear
                />
              )}
            />
        )
    }
    return (
      <div className="form-field">
        {checkIfOriginalDataHasChange(feature && feature?.name)}
        <div className="input-base">
          <input
            {...register(feature && feature?.name)}
            className="input-base__input"
            placeholder={`Enter ${feature?.title.toLowerCase()}`}
          />
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="form-grid">
        <SectionLabel title={feature?.title} description={feature?.description} />
        {renderInput()}
      </div>
      <hr className="form-divider" />
    </>
  );
};

export default BodyFormRefactored;
