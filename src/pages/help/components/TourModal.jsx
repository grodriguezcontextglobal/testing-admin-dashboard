import PropTypes from "prop-types";
import { useState } from "react";
import BlueButtonComponent from "../../../components/UX/buttons/BlueButton";
import GrayButtonComponent from "../../../components/UX/buttons/GrayButton";
import ModalUX from "../../../components/UX/modal/ModalUX";
import { clampStep } from "../utils/tour";
import DashboardMock from "./DashboardMock";
import "./tourModal.css";

/**
 * The tour: the mock on one side, what you are looking at on the other.
 *
 * Mounted only while it is open, so it always opens at the first step without
 * an effect to reset it.
 *
 * Every step can hand the reader off to the article it summarises — the tour is
 * the orientation, the article is the detail, and neither has to repeat the
 * other.
 */
const TourModal = ({ open, tour, mock, onClose, onOpenArticle }) => {
  const [index, setIndex] = useState(0);

  const steps = tour?.steps ?? [];
  const current = clampStep(index, steps.length);
  const step = steps[current];
  const first = current === 0;
  const last = current === steps.length - 1;

  /* Clicking a region jumps to what it is about, rather than being a dead
     decoration in a walkthrough that is otherwise all about clicking. */
  const jumpToRegion = (regionId) => {
    const target = steps.findIndex((entry) => entry.target === regionId);
    if (target >= 0) setIndex(target);
  };

  const body = !step ? null : (
    <div className="help-tour">
      <div className="help-tour__mock">
        <DashboardMock
          mock={mock}
          activeRegion={step.target}
          onRegionClick={jumpToRegion}
        />
      </div>

      <div className="help-tour__panel">
        <p className="help-tour__counter">
          Step {current + 1} of {steps.length}
        </p>
        <h3 className="help-tour__title">{step.title}</h3>
        <p className="help-tour__text">{step.text}</p>

        {step.article && (
          <button
            type="button"
            className="help-tour__article-link"
            onClick={() => onOpenArticle?.(step.article)}
          >
            Read the full article →
          </button>
        )}

        <div className="help-tour__footer">
          <div className="help-tour__controls">
            <GrayButtonComponent
              title="Back"
              buttonType="button"
              size="sm"
              isDisabled={first}
              func={() => setIndex(current - 1)}
            />
            {last ? (
              <BlueButtonComponent
                title="Done"
                buttonType="button"
                size="sm"
                func={onClose}
              />
            ) : (
              <BlueButtonComponent
                title="Next"
                buttonType="button"
                size="sm"
                func={() => setIndex(current + 1)}
              />
            )}
          </div>

          <div className="help-tour__dots" aria-hidden="true">
            {steps.map((entry, position) => (
              <span
                key={`${entry.target}-${position}`}
                className={`help-tour__dot${
                  position === current ? " help-tour__dot--on" : ""
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <ModalUX
      title={tour?.title}
      openDialog={open}
      closeModal={onClose}
      footer={null}
      width={980}
      body={body}
    />
  );
};

TourModal.propTypes = {
  open: PropTypes.bool,
  tour: PropTypes.object,
  mock: PropTypes.object,
  onClose: PropTypes.func.isRequired,
  /** Leaves the tour for the article behind the current step. */
  onOpenArticle: PropTypes.func,
};

export default TourModal;
