import PropTypes from "prop-types";
import { useState } from "react";
import { devitrakApi } from "../../../../../api/devitrakApi";
import { useStatusNotification } from "../../../../../components/notification/alerts/useStatusNotification";
import DocumentUpload from "../../../../Profile/providers/actions/UploadDocument";
import HistoryDocumentProvider from "../../../../Profile/providers/components/HistoryDocumentProvider";
import UpdateProvider from "../../../../Profile/providers/components/UpdateProvider";
import {
  buildNewProviderPayload,
  emptyProviderForm,
  findProviderByName,
  providerFieldErrors,
  resolveCreatedProviderId,
  setProviderField,
} from "../../../../Profile/providers/utils/providerForm";

/**
 * Adding a supplier from inside an inventory screen, then filing its paperwork.
 *
 * Three things were wrong with the write:
 *
 *  - `handleNewProviderSubmit` wrapped everything in `if (…all fields…)` with no
 *    `else`, so an incomplete form made the button do nothing at all. That
 *    branch belongs to the form now, which names the missing field.
 *  - `clearUpForm` reset `industry` to `""` and `services` to `[]`, but the
 *    endpoint requires both — so the *second* supplier added without closing
 *    the modal was rejected, silently. Both resets go through
 *    `emptyProviderForm()` now, and there is one of them.
 *  - No saving state and no handling of `ok: false`. Two clicks on Add created
 *    two suppliers, and a refused write said nothing.
 *
 * Once the supplier exists the modal stays open on its document list, because
 * the reason you are adding a supplier is usually that you are holding its
 * first invoice. The same list is the permanent home for the rest: a supplier
 * relationship produces receipts for years, and they are all filed here or from
 * Profile → Suppliers, against the same record.
 */
const NewSupplier = ({
  setSupplierModal,
  user,
  queryClient,
  providersList,
  supplierModal,
  refetchingAfterNewSupplier,
}) => {
  const [newProvider, setNewProvider] = useState(emptyProviderForm());
  const [isSaving, setIsSaving] = useState(false);
  const [failure, setFailure] = useState("");
  const [created, setCreated] = useState(null);
  const [filingDocument, setFilingDocument] = useState(false);
  const { notify, contextHolder } = useStatusNotification();

  const handleInputChange = (domEvent) => {
    const { name, value } = domEvent.target;
    setNewProvider((current) => setProviderField(current, name, value));
  };

  const close = () => {
    setCreated(null);
    setFilingDocument(false);
    setNewProvider(emptyProviderForm());
    setSupplierModal(false);
  };

  /* The provider as the server now holds it, so a document filed a moment ago
     shows up without closing and reopening. Falls back to the local record
     until the refetched list carries it. */
  const liveProvider = () => {
    const list = providersList.data?.data?.providerCompanies ?? [];
    const found = list.find(
      (provider) => String(provider?.id ?? provider?._id) === created?.id
    );
    return found ?? created?.record ?? null;
  };

  const handleNewProviderSubmit = async () => {
    // The form stops an incomplete submit and says so; this is the backstop.
    if (Object.keys(providerFieldErrors(newProvider)).length > 0) return;

    setFailure("");
    setIsSaving(true);
    try {
      const payload = buildNewProviderPayload({
        provider: newProvider,
        user,
        timestamp: new Date().toISOString(),
      });
      const response = await devitrakApi.post("/company/new_provider", payload);
      if (!response.data?.ok) {
        setFailure(
          response.data?.msg ||
            "The supplier was not saved. Nothing was added — try again."
        );
        setIsSaving(false);
        return;
      }

      queryClient.invalidateQueries([
        "providersCompanyQuery",
        user?.companyData?.id,
      ]);
      const refreshed = await providersList.refetch();
      refetchingAfterNewSupplier();

      /* The endpoint is documented by its request only, so the id is taken from
         the response when it carries one and from the refetched list by name
         when it does not. */
      const fromList = findProviderByName(
        refreshed?.data?.data?.providerCompanies,
        payload.companyName
      );
      const id =
        resolveCreatedProviderId(response.data) ??
        (fromList ? String(fromList.id ?? fromList._id) : null);

      notify("success", `${payload.companyName} was added.`);
      setIsSaving(false);

      if (!id) {
        // Without an id nothing can be filed against it from here. Say so
        // rather than opening a document list that would upload to `undefined`.
        notify(
          "info",
          "Documents can be filed against it from Profile → Suppliers."
        );
        return close();
      }

      setNewProvider(emptyProviderForm());
      setCreated({
        id,
        name: payload.companyName,
        record: fromList ?? { ...payload, id, documents: [] },
      });
    } catch (error) {
      setFailure(error.message);
      setIsSaving(false);
    }
  };

  if (created) {
    if (filingDocument) {
      return (
        <>
          {contextHolder}
          <DocumentUpload
            openDialog
            setOpenDialog={() => setFilingDocument(false)}
            providerId={created.id}
            providerName={created.name}
            refetch={() => providersList.refetch()}
            onUploaded={(filed) => {
              notify("success", `${filed.title} was filed.`);
              setFilingDocument(false);
            }}
          />
        </>
      );
    }

    return (
      <>
        {contextHolder}
        <HistoryDocumentProvider
          openDocumentHistory
          setOpenDocumentHistory={close}
          selectedProvider={liveProvider()}
          onUploadDocument={() => setFilingDocument(true)}
          lead={`${created.name} was added. File its receipts and invoices here, now or any time.`}
        />
      </>
    );
  }

  return (
    <>
      {contextHolder}
      <UpdateProvider
        openDialog={supplierModal}
        setOpenDialog={setSupplierModal}
        newProvider={newProvider}
        handleInputChange={handleInputChange}
        handleSubmit={handleNewProviderSubmit}
        dialogMode="add"
        setNewProvider={setNewProvider}
        isSaving={isSaving}
        failure={failure}
      />
    </>
  );
};

NewSupplier.propTypes = {
  setSupplierModal: PropTypes.func.isRequired,
  user: PropTypes.object.isRequired,
  queryClient: PropTypes.object.isRequired,
  providersList: PropTypes.object.isRequired,
  supplierModal: PropTypes.bool,
  refetchingAfterNewSupplier: PropTypes.func.isRequired,
};

export default NewSupplier;
