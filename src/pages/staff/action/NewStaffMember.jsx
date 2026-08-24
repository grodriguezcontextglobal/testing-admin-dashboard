/* eslint-disable react/prop-types */
import { yupResolver } from "@hookform/resolvers/yup";
import { MenuItem, Select } from "@mui/material";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useSelector } from "react-redux";
import { devitrakApi } from "../../../api/devitrakApi";
import { notifyStatus } from "../../../components/notification/alerts/useStatusNotification";
import BlueButtonComponent from "../../../components/UX/buttons/BlueButton";
import GrayButtonComponent from "../../../components/UX/buttons/GrayButton";
import Input from "../../../components/UX/inputs/Input";
import Label from "../../../components/UX/inputs/Label";
import ModalUX from "../../../components/UX/modal/ModalUX";
import { ROLE_LEVELS, resolveRoleType } from "../../../config/roles";
import { AntSelectorStyle } from "../../../styles/global/AntSelectorStyle";
import clearCacheMemory from "../../../utils/actions/clearCacheMemory";
import "./newStaffMember.css";
import {
  buildEmployeeEntry,
  buildInvitationLink,
  buildRoleOptions,
  existingEmployeeMessage,
  findCompanyEmployee,
  newStaffSchema,
  roleHintFor,
} from "./utils/newStaffMemberUtils";

const titleStyle = {
  color: "var(--gray-900, #101828)",
  fontFamily: "Inter",
  fontSize: "18px",
  fontWeight: 600,
  lineHeight: "28px",
  margin: 0,
};

/**
 * Inviting someone onto the company's staff, in two named steps.
 *
 * The form was one column with a button labelled "Verify email" that, when the
 * email belonged to an existing account, appended the employee to
 * Company.employees and sent them an invitation on the spot — no review, no
 * confirmation, and a label describing none of it. Pressing Enter in the email
 * field did the same, because submitting the form fell through to the same
 * function. The name it looked up was written into fields that were not
 * rendered, so the person doing the inviting never saw who they had invited
 * until the success toast named them afterwards.
 *
 * Now:
 *
 *   Step 1 — find the person. Reads only: the company's own employee list
 *            first (inviting someone already on it used to append a duplicate
 *            entry), then /staff/admin-users.
 *   Step 2 — choose a role and send. The person is shown by name, each role
 *            says what it grants, and the only button that writes anything is
 *            called "Send invitation".
 *
 * Same four requests, same bodies.
 */
export const NewStaffMember = ({ modalState, setModalState }) => {
  const { user } = useSelector((state) => state.admin);
  const queryClient = useQueryClient();

  const [step, setStep] = useState(1);
  const [lookup, setLookup] = useState(null);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [notice, setNotice] = useState(null);

  const userLevel = ROLE_LEVELS[resolveRoleType(user)] ?? 99;
  const roleOptions = buildRoleOptions(userLevel);
  const needCreate = Boolean(lookup) && !lookup.exists;

  const {
    control,
    register,
    setValue,
    setError,
    trigger,
    watch,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(newStaffSchema, { context: { needCreate } }),
    defaultValues: { email: "", name: "", lastName: "", phoneNumber: "", role: "" },
  });

  const companiesQuery = useQuery({
    queryKey: ["companyListQuery"],
    queryFn: () =>
      devitrakApi.post("/company/search-company", { _id: user.companyData.id }),
    refetchOnMount: false,
  });

  useEffect(() => {
    const controller = new AbortController();
    companiesQuery.refetch();
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.company]);

  const closeModal = () => {
    if (isSending) return;
    setModalState(false);
  };

  /**
   * The company record, fetched if the query has not answered yet.
   *
   * Both callers need the employees array — one to check it, one to append to
   * it — and reading it straight off `companiesQuery.data` meant that whichever
   * ran before the query resolved simply saw nothing: the duplicate check
   * passed silently, and the append threw.
   */
  const loadCompany = async ({ fresh = false } = {}) => {
    const response =
      !fresh && companiesQuery.data
        ? companiesQuery.data
        : (await companiesQuery.refetch()).data;
    return response?.data?.company?.[0] ?? null;
  };

  const addEmployeeAndInvite = async ({ name, lastName, email, role }) => {
    // Read the list again right before writing it back: this PATCH replaces the
    // whole employees array, so appending onto a copy fetched when the modal
    // opened drops anyone another administrator added in between.
    const companyInfo = await loadCompany({ fresh: true });
    if (!companyInfo) {
      throw new Error("Company info not loaded. Please try again.");
    }

    // The search-company response's own id field isn't reliable here (this
    // was the only spot in src/pages/staff reading it instead of the
    // already-known user.companyData.id every sibling mutation uses —
    // DeleteStaffMember.jsx's identical update-company PATCH included —
    // so a falsy companyInfo.id silently short-circuited this function
    // while the caller went on to report success and close the modal).
    await devitrakApi.patch(`/company/update-company/${user.companyData.id}`, {
      employees: [
        ...(companyInfo.employees ?? []),
        buildEmployeeEntry({ name, lastName, email, role }),
      ],
    });

    await devitrakApi.post("/nodemailer/new_invitation", {
      consumer: email,
      subject: "Invitation",
      company: user.company,
      link: buildInvitationLink({
        name,
        lastName,
        email,
        company: user.company,
        companyId: user.companyData.id,
      }),
    });

    queryClient.invalidateQueries({ queryKey: ["listAdminUsers"], exact: true });
    queryClient.invalidateQueries({ queryKey: ["staff"], exact: true });
    queryClient.invalidateQueries({
      queryKey: ["employeesPerCompanyList"],
      exact: true,
    });
    queryClient.invalidateQueries({ queryKey: ["companyListQuery"], exact: true });
    // Both cache keys are independent, so clear them concurrently instead of
    // one after the other.
    await Promise.all([
      clearCacheMemory(`_id=${user.companyData.id}`),
      clearCacheMemory(`company_id=${user.companyData.id}`),
    ]);
  };

  /**
   * Step 1. Reads only — this used to be the button that sent the invitation.
   */
  const findPerson = async () => {
    setNotice(null);
    if (!(await trigger("email"))) return;

    const email = String(watch("email") ?? "").trim();

    setIsLookingUp(true);
    try {
      // The company's own list first: the employees array was already loaded
      // here to append to, and never checked, so re-inviting an existing member
      // added a second entry for the same person.
      const alreadyStaff = findCompanyEmployee(
        (await loadCompany())?.employees,
        email
      );
      if (alreadyStaff) {
        return setError("email", {
          type: "manual",
          message: existingEmployeeMessage(alreadyStaff),
        });
      }

      const resp = await devitrakApi.post("/staff/admin-users", { email });
      const existing = resp?.data?.adminUsers?.at(-1);

      if (existing) {
        setValue("name", existing.name ?? "");
        setValue("lastName", existing.lastName ?? "");
        setLookup({
          exists: true,
          email,
          name: existing.name ?? "",
          lastName: existing.lastName ?? "",
        });
      } else {
        setLookup({ exists: false, email, name: "", lastName: "" });
      }
      setStep(2);
    } catch {
      setNotice("We could not check that email. Try again in a moment.");
    } finally {
      setIsLookingUp(false);
    }
  };

  /** Step 2. The only path that writes anything. */
  const sendInvitation = async (data) => {
    setNotice(null);
    setIsSending(true);
    try {
      if (needCreate) {
        await devitrakApi.post("/db_staff/new_member", {
          first_name: data.name,
          last_name: data.lastName,
          email: data.email,
          phone_number: data.phoneNumber,
        });
      }

      await addEmployeeAndInvite({
        name: data.name || "Staff",
        lastName: data.lastName || "Member",
        email: data.email,
        role: data.role,
      });

      // Static notification: the modal closes on the next line, and a hook-bound
      // notification would unmount with it before it could be read.
      notifyStatus(
        "success",
        `Invitation queued for ${data.name} ${data.lastName}.`.trim()
      );
      setModalState(false);
    } catch {
      setNotice(
        "The invitation was not sent. Nothing was added to your staff list."
      );
    } finally {
      setIsSending(false);
    }
  };

  // Step 1 must not submit the form: `handleSubmit` would validate the role,
  // which has not been chosen yet, and Enter in the email field used to fall
  // through to the invitation itself.
  const onFormSubmit = (event) => {
    event.preventDefault();
    if (step === 1) return findPerson();
    return handleSubmit(sendInvitation)(event);
  };

  const goBack = () => {
    setNotice(null);
    setStep(1);
    setLookup(null);
  };

  const selectedRole = watch("role");
  const personName = [watch("name"), watch("lastName")].filter(Boolean).join(" ");

  const stepOne = (
    <>
      <div>
        <p className="new-staff__step">Step 1 of 2 · Find the person</p>
        <p className="new-staff__lead">
          We check whether they already have a Devitrak account before inviting
          them. Nothing is sent yet.
        </p>
      </div>

      <div className="new-staff__fields">
        <div className="new-staff__field">
          <Label>Email</Label>
          <Input
            {...register("email")}
            autoFocus
            placeholder="name@company.com"
            error={!!errors.email}
            helperText={errors.email?.message}
          />
        </div>
      </div>
    </>
  );

  const stepTwo = (
    <>
      <div>
        <p className="new-staff__step">Step 2 of 2 · Choose a role</p>
        <p className="new-staff__lead">
          {lookup?.exists
            ? "This person already has an account. Pick what they can do in your company."
            : "This email is new to Devitrak, so their account is created with the invitation."}
        </p>
      </div>

      <div className="new-staff__person">
        <p className="new-staff__person-name">
          {personName || "New staff member"}
        </p>
        <p className="new-staff__person-email">{lookup?.email}</p>
        <span
          className={`new-staff__badge new-staff__badge--${
            lookup?.exists ? "known" : "new"
          }`}
        >
          {lookup?.exists ? "Existing account" : "New account"}
        </span>
      </div>

      <div className="new-staff__fields">
        {needCreate && (
          <>
            <div className="new-staff__row">
              <div className="new-staff__field">
                <Label>Name</Label>
                <Input
                  {...register("name")}
                  autoFocus
                  placeholder="Enter name"
                  error={!!errors.name}
                  helperText={errors.name?.message}
                />
              </div>
              <div className="new-staff__field">
                <Label>Last name</Label>
                <Input
                  {...register("lastName")}
                  placeholder="Enter last name"
                  error={!!errors.lastName}
                  helperText={errors.lastName?.message}
                />
              </div>
            </div>

            <div className="new-staff__field">
              <Label>Phone number</Label>
              <Input
                {...register("phoneNumber")}
                placeholder="Enter phone number"
                error={!!errors.phoneNumber}
                helperText={errors.phoneNumber?.message}
              />
            </div>
          </>
        )}

        <div className="new-staff__field">
          <Label>Role</Label>
          {roleOptions.length === 0 ? (
            <p className="new-staff__notice">
              Your role cannot grant any of the available roles. Ask an
              administrator to send this invitation.
            </p>
          ) : (
            <>
              {/* Controller, not register: MUI Select needs a value and an
                  onChange, and register alone left it uncontrolled. */}
              <Controller
                control={control}
                name="role"
                render={({ field }) => (
                  <Select
                    {...field}
                    value={field.value ?? ""}
                    displayEmpty
                    fullWidth
                    style={AntSelectorStyle}
                  >
                    <MenuItem value="" disabled>
                      Select a role
                    </MenuItem>
                    {roleOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                )}
              />
              {errors?.role?.message && (
                <p className="new-staff__error">{errors.role.message}</p>
              )}
              {selectedRole !== "" && selectedRole !== undefined && (
                <p className="new-staff__hint">{roleHintFor(selectedRole)}</p>
              )}
            </>
          )}
        </div>
      </div>

      <p className="new-staff__consequence">
        Sending adds them to your company as <strong>Pending</strong> and emails
        them a link to accept.
      </p>
    </>
  );

  const bodyModal = (
    <form className="new-staff" onSubmit={onFormSubmit}>
      {step === 1 ? stepOne : stepTwo}

      {notice && <p className="new-staff__notice">{notice}</p>}

      <div className="new-staff__footer">
        <GrayButtonComponent
          title={step === 1 ? "Cancel" : "Back"}
          buttonType="button"
          func={step === 1 ? closeModal : goBack}
          disabled={isLookingUp || isSending}
        />
        {step === 1 ? (
          <BlueButtonComponent
            title="Continue"
            buttonType="submit"
            isLoading={isLookingUp}
            isDisabled={isLookingUp}
          />
        ) : (
          <BlueButtonComponent
            title="Send invitation"
            buttonType="submit"
            isLoading={isSending}
            isDisabled={isSending || roleOptions.length === 0}
          />
        )}
      </div>
    </form>
  );

  return (
    <ModalUX
      title={<p style={titleStyle}>Add a staff member</p>}
      openDialog={modalState}
      closeModal={closeModal}
      closable={!isSending}
      width={520}
      footer={null}
      body={bodyModal}
    />
  );
};
