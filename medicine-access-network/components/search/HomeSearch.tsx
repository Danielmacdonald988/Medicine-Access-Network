import Link from "next/link";
import { ArrowRight, Check, ChevronDown, MapPin, Search } from "lucide-react";
import styles from "@/app/home.module.css";

/** Native GET navigation keeps discovery usable before client JavaScript loads. */
export function HomeSearch() {
  return (
    <form
      action="/facilitators"
      method="get"
      role="search"
      aria-label="Find support"
      className={styles.searchForm}
    >
      <div className={styles.searchBar}>
        <div className={styles.searchField}>
          <Search size={23} strokeWidth={1.5} aria-hidden />
          <div>
            <label htmlFor="home-support">What kind of support?</label>
            <div className={styles.selectWrap}>
              <select id="home-support" name="q" defaultValue="">
                <option value="">All practices</option>
                <option value="preparation">Psychedelic preparation</option>
                <option value="integration">Integration</option>
                <option value="breathwork">Breathwork</option>
                <option value="somatic">Somatic practices</option>
                <option value="meditation">Meditation</option>
                <option value="recovery">Recovery support</option>
              </select>
              <ChevronDown size={16} aria-hidden />
            </div>
          </div>
        </div>
        <div className={`${styles.searchField} ${styles.locationField}`}>
          <MapPin size={23} strokeWidth={1.5} aria-hidden />
          <div>
            <label htmlFor="home-location">
              Where feels right? <span>(optional)</span>
            </label>
            <input
              id="home-location"
              name="location"
              maxLength={100}
              placeholder="City, region, or country"
            />
          </div>
        </div>
        <button className={styles.searchSubmit} type="submit">
          Find my support <ArrowRight size={19} aria-hidden />
        </button>
      </div>
      <div className={styles.underSearch}>
        <span>
          <Check size={16} aria-hidden />
          Free to explore. No account needed.
        </span>
        <label className={styles.remoteChoice}>
          <input type="checkbox" name="remote" value="true" />
          Online sessions
        </label>
        <Link href="/facilitators">
          Browse all guides <ArrowRight size={15} aria-hidden />
        </Link>
      </div>
    </form>
  );
}
