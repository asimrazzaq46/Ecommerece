import React from "react";
import { useTranslation } from "react-i18next";
import Stars from "../ui/Stars";

// UPDATED: Veyra reviews section: rating summary + real distribution + review cards.
const ListReviews = ({ reviews, rating, action }) => {
  const { t } = useTranslation();
  const total = reviews.length;
  const share = (star) => (total ? Math.round((reviews.filter((r) => Math.round(r.rating) === star).length / total) * 100) : 0);

  return (
    <section className="vx-card vx-reviews" id="reviews">
      <div className="vx-reviews-summary">
        <span className="vx-eyebrow">{t("product.reviews.eyebrow")}</span>
        <h2 className="vx-title-xl">{t("product.reviews.title")}</h2>
        <p className="vx-muted">{t("product.reviews.subtitle")}</p>
        <div className="vx-reviews-score">
          <div className="vx-reviews-avg">
            <strong>{Number(rating || 0).toFixed(1)}</strong>
            <Stars value={rating} />
            <span className="vx-label">{t("product.reviews.basedOn", { count: total })}</span>
          </div>
          <div className="vx-reviews-bars">
            {[5, 4, 3, 2, 1].map((star) => (
              <div key={star} className="vx-reviews-bar">
                <span>{star}★</span>
                <span className="vx-reviews-track">
                  <span style={{ width: `${share(star)}%` }} />
                </span>
                <span className="vx-muted">{share(star)}%</span>
              </div>
            ))}
          </div>
        </div>
        {action}
      </div>

      <div className="vx-reviews-list">
        {total === 0 && <p className="vx-reviews-empty">{t("product.reviews.none")}</p>}
        {reviews.map((review) => (
          <article key={review._id} className="vx-review">
            <div className="vx-review-head">
              <span className="vx-title-sm">{review.name}</span>
              <Stars value={review.rating} />
            </div>
            <p>{review.comment}</p>
          </article>
        ))}
      </div>
    </section>
  );
};

export default ListReviews;
