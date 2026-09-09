import PropTypes from "prop-types";
import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import BlueButtonComponent from "../../components/UX/buttons/BlueButton";
import GrayButtonComponent from "../../components/UX/buttons/GrayButton";
import Input from "../../components/UX/inputs/Input";
import { ProfileSection } from "../../components/UX/profile";
import TourModal from "./components/TourModal";
import { MANUAL_PENDING, MANUAL_SECTIONS } from "./content";
import { DASHBOARD_MOCKS, SECTION_TOURS } from "./content/tours";
import { getMock, getTour } from "./utils/tour";
import {
  findArticle,
  flattenArticles,
  manualToPlainText,
  searchArticles,
} from "./utils/manual";
import "./help.css";

/**
 * The user manual, served from inside the app.
 *
 * The content is data, not Markdown (see utils/manual.js for why), and this
 * page is only its reader: a nav of what there is, a search over all of it, and
 * one article at a time. Each article carries the route where the feature
 * actually lives, so the manual can hand you over to the thing it just
 * explained.
 *
 * The URL is /help/<article id>, which makes every article linkable — support
 * can send someone straight to the paragraph that answers them.
 */
const ArticleBody = ({ article, onOpen, onStartTour }) => {
  const tour = getTour(SECTION_TOURS, article.sectionId);
  const steps = article.steps ?? [];
  const rules = article.rules ?? [];
  const pitfalls = article.pitfalls ?? [];
  const related = (article.related ?? [])
    .map((id) => findArticle(MANUAL_SECTIONS, id))
    .filter(Boolean);

  return (
    <article className="help-article">
      <div className="help-article__intro">
        <div className="help-article__head">
          <p className="help-article__eyebrow">{article.sectionTitle}</p>
          <h1 className="help-article__title">{article.title}</h1>
        </div>

        <div className="help-article__meta">
          {article.appRoute && (
            <Link className="help-article__where" to={article.appRoute}>
              Open this in the app →
            </Link>
          )}
          {article.elevated && (
            <span className="help-article__elevated">
              Needs elevated permissions
            </span>
          )}
          {tour && (
            <span className="help-article__meta-actions">
              <GrayButtonComponent
                title={tour.title}
                buttonType="button"
                size="sm"
                func={onStartTour}
              />
            </span>
          )}
        </div>

        {article.summary && (
          <p className="help-article__summary">{article.summary}</p>
        )}
      </div>

      {steps.length > 0 && (
        <ProfileSection title="How to do it" testId="help-steps">
          <ol className="help-article__steps">
            {steps.map((step, index) => (
              <li key={`${article.id}-step-${index}`}>
                <p className="help-article__step-text">{step.text}</p>
                {step.note && (
                  <p className="help-article__step-note">{step.note}</p>
                )}
              </li>
            ))}
          </ol>
        </ProfileSection>
      )}

      {rules.length > 0 && (
        <ProfileSection
          title="What the app enforces"
          description="Rules you can rely on, rather than conventions you have to remember."
          testId="help-rules"
        >
          <ul className="help-article__bullets">
            {rules.map((rule, index) => (
              <li key={`${article.id}-rule-${index}`}>{rule}</li>
            ))}
          </ul>
        </ProfileSection>
      )}

      {pitfalls.length > 0 && (
        <ProfileSection
          title="Watch out"
          description="What goes wrong here, and what it costs."
          testId="help-pitfalls"
        >
          <ul className="help-article__bullets">
            {pitfalls.map((pitfall, index) => (
              <li key={`${article.id}-pitfall-${index}`}>{pitfall}</li>
            ))}
          </ul>
        </ProfileSection>
      )}

      {related.length > 0 && (
        <ProfileSection title="Related" testId="help-related">
          <div className="help-article__related">
            {related.map((entry) => (
              <button
                key={entry.id}
                type="button"
                className="help-article__related-link"
                onClick={() => onOpen(entry.id)}
              >
                {entry.title}
              </button>
            ))}
          </div>
        </ProfileSection>
      )}
    </article>
  );
};

ArticleBody.propTypes = {
  article: PropTypes.object.isRequired,
  onOpen: PropTypes.func.isRequired,
  onStartTour: PropTypes.func.isRequired,
};

const HelpMainPage = () => {
  const { articleId } = useParams();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [tourOpen, setTourOpen] = useState(false);

  const matches = useMemo(
    () => searchArticles(MANUAL_SECTIONS, search),
    [search],
  );
  const matchedIds = useMemo(
    () => new Set(matches.map((article) => article.id)),
    [matches],
  );

  /* The requested article wins, even when the search does not match it — a
     deep link should open what it points at rather than being overruled by a
     search box the reader has not touched. Otherwise: the first match. */
  const selected =
    findArticle(MANUAL_SECTIONS, articleId) ??
    matches[0] ??
    flattenArticles(MANUAL_SECTIONS)[0] ??
    null;

  const openArticle = (id) => navigate(`/help/${id}`);
  const selectedTour = getTour(SECTION_TOURS, selected?.sectionId);

  /* The whole manual as one text file. Two audiences: somebody who wants it on
     paper for a site with no signal, and the support assistant we may build —
     its knowledge is meant to be bounded by exactly this manual, and this is
     the file it would be given. */
  const downloadManual = () => {
    const blob = new Blob([manualToPlainText(MANUAL_SECTIONS)], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "devitrak-user-manual.txt";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="help-page">
      <header className="help-page__head">
        <h1 className="help-article__title">User manual</h1>
        <p className="help-article__summary">
          How each part of Devitrak is meant to be used — the steps, the rules
          the app enforces for you, and the places it is easy to get burnt.
        </p>
        <div className="help-page__toolbar">
          <div className="help-page__search">
            {/* <label className="help-page__label" htmlFor="help-search">
              Search the manual
            </label> */}
            <Input
              id="help-search"
              name="help-search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Try “close an event”, “deposit”, “serial”"
            />
          </div>
          <GrayButtonComponent
            title="Download as text"
            buttonType="button"
            func={downloadManual}
          />
        </div>
      </header>

      <div className="help-page__layout">
        <nav className="help-nav" aria-label="Manual contents">
          {MANUAL_SECTIONS.map((section) => {
            const articles = (section.articles ?? []).filter((article) =>
              matchedIds.has(article.id),
            );
            if (articles.length === 0) return null;
            return (
              <div className="help-nav__group" key={section.id}>
                <p className="help-nav__section-title">{section.title}</p>
                <ul className="help-nav__list">
                  {articles.map((article) => (
                    <li key={article.id}>
                      <button
                        type="button"
                        className={`help-nav__item${
                          selected?.id === article.id
                            ? " help-nav__item--active"
                            : ""
                        }`}
                        aria-current={selected?.id === article.id}
                        onClick={() => openArticle(article.id)}
                      >
                        {article.title}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}

          {matches.length === 0 && (
            <p className="help-nav__empty">
              Nothing in the manual matches “{search}”. The manual does not
              cover everything yet — the list below says what is still missing.
            </p>
          )}

          <div className="help-nav__group">
            <p className="help-nav__section-title">Not written yet</p>
            <ul className="help-nav__pending-list">
              {MANUAL_PENDING.map((pending) => (
                <li key={pending}>{pending}</li>
              ))}
            </ul>
          </div>
        </nav>

        {selected ? (
          <ArticleBody
            article={selected}
            onOpen={openArticle}
            onStartTour={() => setTourOpen(true)}
          />
        ) : (
          <p className="help-nav__empty">The manual is empty.</p>
        )}
      </div>

      {/* Mounted only while open, so the tour always starts at step one. */}
      {tourOpen && selectedTour && (
        <TourModal
          open={tourOpen}
          tour={selectedTour}
          mock={getMock(DASHBOARD_MOCKS, selectedTour.mockId)}
          onClose={() => setTourOpen(false)}
          onOpenArticle={(id) => {
            setTourOpen(false);
            openArticle(id);
          }}
        />
      )}
    </div>
  );
};

export default HelpMainPage;
