import { getTranslation } from "@/lib/i18n/server";
import Link from "next/link";
import { ArrowRight, Check, ChevronDown, MapPin, Search } from "lucide-react";
import styles from "@/app/home.module.css";

/** Native GET navigation keeps discovery usable before client JavaScript loads. */
export async function HomeSearch() {
  const { t } = await getTranslation();
  return (
    <form
      action="/facilitators"
      method="get"
      role="search"
      aria-label={t("Find support")}
      className={styles.searchForm}
    >
      <div className={styles.searchBar}>
        <div className={styles.searchField}>
          <Search size={23} strokeWidth={1.5} aria-hidden />
          <div>
            <label htmlFor="home-support">{t("What kind of support?")}</label>
            <div className={styles.selectWrap}>
              <select id="home-support" name="q" defaultValue="">
                <option value="">{t("All practices")}</option>
                <option value="preparation">
                  {t("Psychedelic preparation")}
                </option>
                <option value="integration">{t("Integration")}</option>
                <option value="breathwork">{t("Breathwork")}</option>
                <option value="somatic">{t("Somatic practices")}</option>
                <option value="meditation">{t("Meditation")}</option>
                <option value="recovery">{t("Recovery support")}</option>
              </select>
              <ChevronDown size={16} aria-hidden />
            </div>
          </div>
        </div>
        <div className={`${styles.searchField} ${styles.locationField}`}>
          <MapPin size={23} strokeWidth={1.5} aria-hidden />
          <div>
            <label htmlFor="home-location">
              {" "}
              {t("Where feels right?")} <span>{t("(optional)")}</span>
            </label>
            <input
              id="home-location"
              name="location"
              maxLength={100}
              placeholder={t("City, region, or country")}
            />
          </div>
        </div>
        <button className={styles.searchSubmit} type="submit">
          {" "}
          {t("Find my support")} <ArrowRight size={19} aria-hidden />
        </button>
      </div>
      <div className={styles.underSearch}>
        <span>
          <Check size={16} aria-hidden />{" "}
          {t("Free to explore. No account needed.")}{" "}
        </span>
        <label className={styles.remoteChoice}>
          <input type="checkbox" name="remote" value="true" />{" "}
          {t("Online sessions")}{" "}
        </label>
        <Link href="/facilitators">
          {" "}
          {t("Browse all guides")} <ArrowRight size={15} aria-hidden />
        </Link>
      </div>
    </form>
  );
}
