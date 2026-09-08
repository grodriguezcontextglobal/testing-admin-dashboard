import { DatePicker } from "antd";
import dayjs from "dayjs";
import PropTypes from "prop-types";
import { useContext, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { devitrakApi } from "../../../../api/devitrakApi";
import BlueButtonComponent from "../../../../components/UX/buttons/BlueButton";
import GrayButtonComponent from "../../../../components/UX/buttons/GrayButton";
import SelectComponent from "../../../../components/UX/dropdown/SelectComponent";
import Label from "../../../../components/UX/inputs/Label";
import ModalUX from "../../../../components/UX/modal/ModalUX";
import {
  onAddAdvanceSearch,
  onAddSearchParameters,
} from "../../../../store/slices/searchBarResultSlice";
import "../../../../styles/global/actionForm.css";
import { AdvanceSearchContext } from "./RenderingFilters";
import { formatPeriodLabel } from "./forecastInventory/utils/forecastSummary";
import {
  FILTER_FIELDS,
  buildSearchParameters,
  buildSearchQuery,
  countFilters,
  describeFilters,
  emptyFilters,
  readCachedOptions,
  readSearchError,
  resolveFilterOptions,
  searchFieldErrors,
  writeCachedOptions,
} from "./forecastInventory/utils/forecastSearch";

const { RangePicker } = DatePicker;

const MODAL_WIDTH = 620;

const stepClass = (done) =>
  `action-form__step${done ? " action-form__step--done" : ""}`;

/**
 * Setting up an inventory forecast.
 *
 * The form was four antd `Select`s and a `RangePicker`, each spread with
 * `{...register(name)}` from react-hook-form — which returns a native input's
 * props, so none of it attached — and kept in sync by an explicit `setValue`.
 * Everything was optional except the period, and the period was last.
 *
 * It is two steps now: the period, which is the one required thing and what the
 * forecast is *about*, then the filters that narrow it. The footer states what
 * the search will actually cover before it is run.
 *
 * Behaviour fixed along the way:
 *
 *  - **The filter options came out of a localStorage blob that won over the
 *    live data.** It was written the first time the modal was ever opened and
 *    preferred on every open after, so a category added later never appeared —
 *    and if that first open happened while the inventory query was still
 *    loading, an empty list was cached and the dropdowns stayed empty for good.
 *    The context wins now, and nothing empty is ever cached.
 *  - `onSearch={(value) => setValue(field.name, value)}` set the field to
 *    whatever was **typed in the search box**, so typing "cam" and not picking
 *    anything searched for the category "cam".
 *  - An untouched Select left `data.category` undefined, and the query string
 *    was built by interpolation — so every unfiltered forecast asked the server
 *    for `category=undefined` while Redux recorded `""` for the same search.
 *    Nothing was encoded either, so a value containing `&` broke the query.
 *  - `existingParameters` was pushed in with `setValue`, but the Selects were
 *    uncontrolled — so reopening the modal to adjust a search showed empty
 *    fields with the old values still in the form.
 *  - A successful search sat in `setTimeout(…, 2000)` before navigating.
 *  - The `ok: false` branch closed the modal and *then* set the error, which
 *    rendered inside the modal that had just closed. Nothing was ever shown.
 *  - The whole modal was replaced by a full-screen `DevitrakLoading` until the
 *    options resolved.
 *  - `periodUpdateOnly` changed the wording to "Update the period" and left
 *    every filter editable. The filters are stated, not editable, in that mode.
 *
 * The request is unchanged: the same eight query parameters, and the same
 * unpadded `2026-8-1` day format, both pinned by tests.
 */
const AdvanceSearchModal = ({
  openAdvanceSearchModal,
  setOpenAdvanceSearchModal,
  existingParameters = null,
  periodUpdateOnly = false,
}) => {
  const context = useContext(AdvanceSearchContext);
  const { user } = useSelector((state) => state.admin);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [filters, setFilters] = useState(emptyFilters());
  const [range, setRange] = useState(null);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [failure, setFailure] = useState("");

  const options = useMemo(
    () =>
      resolveFilterOptions({
        context,
        cached: readCachedOptions(window.localStorage),
      }),
    [context]
  );

  /* Refresh the fallback whenever the live context has something to say. */
  useEffect(() => {
    writeCachedOptions(window.localStorage, context);
  }, [context]);

  /* Reopening to adjust a search shows what that search was. */
  useEffect(() => {
    if (!openAdvanceSearchModal || !existingParameters) return;
    setFilters({
      category: existingParameters.category || "",
      group: existingParameters.group || "",
      brand: existingParameters.brand || "",
      location: existingParameters.location || "",
    });
    if (existingParameters.date_start && existingParameters.date_end) {
      setRange([
        dayjs(existingParameters.date_start),
        dayjs(existingParameters.date_end),
      ]);
    }
  }, [existingParameters, openAdvanceSearchModal]);

  const errors = searchFieldErrors({ range });
  const errorFor = (key) => (submitAttempted ? errors[key] : undefined);
  const activeFilters = countFilters(filters);

  const periodLabel = useMemo(() => {
    const [start, end] = Array.isArray(range) ? range : [];
    if (!start || !end) return "";
    return formatPeriodLabel({
      start: start.format?.("YYYY-MM-DD"),
      end: end.format?.("YYYY-MM-DD"),
    });
  }, [range]);

  const closeModal = () => {
    setSubmitAttempted(false);
    setFailure("");
    setOpenAdvanceSearchModal(false);
  };

  const search = async () => {
    setSubmitAttempted(true);
    setFailure("");
    if (Object.keys(errors).length > 0) return;

    setIsSearching(true);
    try {
      const parameters = buildSearchParameters({ filters, range });
      dispatch(onAddSearchParameters(parameters));

      const response = await devitrakApi.get(
        buildSearchQuery({ parameters, user })
      );

      if (!response.data?.ok) {
        // Was: close the modal, then set the message that renders inside it.
        setFailure(
          response.data?.msg ||
            "No inventory matches those parameters. Try a wider period, or fewer filters."
        );
        setIsSearching(false);
        return;
      }

      dispatch(onAddAdvanceSearch(response.data));
      setIsSearching(false);
      if (periodUpdateOnly) return setOpenAdvanceSearchModal(false);
      return navigate("/inventory/advance_search_result");
    } catch (error) {
      setFailure(readSearchError(error));
      setIsSearching(false);
    }
  };

  const titleRender = () => (
    <div className="action-form__header">
      <h2 className="action-form__title">
        {periodUpdateOnly ? "Change the period" : "Forecast inventory"}
      </h2>
    </div>
  );

  const bodyModal = () => (
    <div className="action-form">
      <p className="action-form__lead">
        {periodUpdateOnly
          ? "The same search, over a different window. Your filters are kept."
          : "What your inventory looks like over a period: what is committed, what is left, and where it runs short."}
      </p>

      <section className={stepClass(Boolean(periodLabel))}>
        <div className="action-form__step-head">
          <h3 className="action-form__step-title">
            <span className="action-form__step-index">1</span>
            The period
          </h3>
        </div>
        <div className="action-form__field">
          <Label htmlFor="forecast-period" required>Period</Label>
          <RangePicker
            id="forecast-period"
            size="large"
            style={{ width: "100%" }}
            value={range}
            onChange={(value) => setRange(value)}
            disabled={isSearching}
            status={errorFor("range") ? "error" : undefined}
          />
          {errorFor("range") ? (
            <p className="action-form__feedback action-form__feedback--error">
              {errorFor("range")}
            </p>
          ) : (
            <p className="action-form__step-note">
              {periodLabel || "Any window — a weekend, a month, next quarter."}
            </p>
          )}
        </div>
      </section>

      {periodUpdateOnly ? (
        <p className="action-form__banner action-form__banner--neutral">
          {describeFilters(filters)}
        </p>
      ) : (
        <section className={stepClass(activeFilters > 0)}>
          <div className="action-form__step-head">
            <h3 className="action-form__step-title">
              <span className="action-form__step-index">2</span>
              Narrow it down
            </h3>
            <span className="action-form__step-note">
              {activeFilters === 0
                ? "Optional — everything is included"
                : `${activeFilters} of 4 set`}
            </span>
          </div>

          <div className="action-form__grid">
            {FILTER_FIELDS.map((field) => {
              const items = options[field.name] ?? [];
              return (
                <div className="action-form__field" key={field.name}>
                  <SelectComponent
                    label={field.label}
                    placeholder={
                      items.length === 0
                        ? `No ${field.plural} in your inventory yet`
                        : `Any ${field.label.toLowerCase()}`
                    }
                    items={items}
                    value={
                      items.find((item) => item.id === filters[field.name]) ??
                      null
                    }
                    onSelect={(option) =>
                      setFilters((current) => ({
                        ...current,
                        [field.name]: option?.id ?? "",
                      }))
                    }
                  />
                </div>
              );
            })}
          </div>
        </section>
      )}

      {failure && <p className="action-form__notice">{failure}</p>}

      <div className="action-form__footer">
        <p className="action-form__consequence">{describeFilters(filters)}</p>
        {!periodUpdateOnly && activeFilters > 0 && (
          <GrayButtonComponent
            title="Clear filters"
            buttonType="button"
            func={() => setFilters(emptyFilters())}
            isDisabled={isSearching}
          />
        )}
        <GrayButtonComponent
          title="Cancel"
          buttonType="button"
          func={closeModal}
          isDisabled={isSearching}
        />
        <BlueButtonComponent
          title={periodUpdateOnly ? "Update period" : "Run forecast"}
          buttonType="button"
          func={search}
          isDisabled={isSearching}
          isLoading={isSearching}
        />
      </div>
    </div>
  );

  return (
    <ModalUX
      title={titleRender()}
      openDialog={openAdvanceSearchModal}
      closeModal={closeModal}
      body={bodyModal()}
      width={MODAL_WIDTH}
    />
  );
};

AdvanceSearchModal.propTypes = {
  openAdvanceSearchModal: PropTypes.bool,
  setOpenAdvanceSearchModal: PropTypes.func.isRequired,
  existingParameters: PropTypes.object,
  periodUpdateOnly: PropTypes.bool,
};

export default AdvanceSearchModal;
