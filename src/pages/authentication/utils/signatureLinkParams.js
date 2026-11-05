/**
 * The fields of a contract-signature link (/authenticate/... pages for staff
 * members and consumers). Read once per page: they don't change while the
 * page is open. A field the link leaves out is null.
 */
export const readSignatureLinkParams = (search) => {
  const params = new URLSearchParams(search ?? "");
  return {
    company_id: params.get("company_id"),
    documentUrl: params.get("contract_url"),
    date_reference: params.get("date_reference"),
    verification_id: params.get("ver_id"),
    item_ids: params.get("item_ids"),
    consumer_info: params.get("consumer_member_id"),
    staff_member_id: params.get("staff_member_id"),
  };
};
