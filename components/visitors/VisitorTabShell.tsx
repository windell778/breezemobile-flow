"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

type VisitorTabShellProps = {
  tabs: Array<[string, string]>;
  initialTab: string;
  visitorId: string;
  activeSessionId: string;
  children: ReactNode;
};

const referenceMenuWidthEm = 32.05;
const referenceItemCount = 5;

function buildVisitorTabUrl(visitorId: string, sessionId: string, tab: string) {
  const tabQuery = tab === "resumen" ? "" : `&tab=${tab}`;
  return `/visitantes/${visitorId}?session=${sessionId}${tabQuery}`;
}

export function VisitorTabShell({
  tabs,
  initialTab,
  visitorId,
  activeSessionId,
  children,
}: VisitorTabShellProps) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const menuRef = useRef<HTMLMenuElement>(null);
  const menuBorderRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const offsetMenuBorder = useCallback((element: HTMLButtonElement | null) => {
    const menu = menuRef.current;
    const menuBorder = menuBorderRef.current;

    if (!menu || !menuBorder || !element) return;

    const offsetActiveItem = element.getBoundingClientRect();
    const offsetMenu = menu.getBoundingClientRect();
    const left =
      Math.floor(
        offsetActiveItem.left - offsetMenu.left + menu.scrollLeft - (menuBorder.offsetWidth - offsetActiveItem.width) / 2
      ) + "px";

    menuBorder.style.transform = `translate3d(${left}, 0 , 0)`;
  }, []);

  const syncBorderToTab = useCallback(
    (tab: string) => {
      const index = tabs.findIndex(([key]) => key === tab);
      offsetMenuBorder(itemRefs.current[index] || null);
    },
    [offsetMenuBorder, tabs]
  );

  const activateTab = useCallback(
    (tab: string) => {
      const menu = menuRef.current;

      if (activeTab === tab) return;

      menu?.style.removeProperty("--timeOut");
      setActiveTab(tab);
      window.history.pushState(null, "", buildVisitorTabUrl(visitorId, activeSessionId, tab));
      requestAnimationFrame(() => syncBorderToTab(tab));
    },
    [activeSessionId, activeTab, syncBorderToTab, visitorId]
  );

  useEffect(() => {
    function handlePopState() {
      const params = new URLSearchParams(window.location.search);
      const nextTab = params.get("tab") || "resumen";
      const safeTab = tabs.some(([key]) => key === nextTab) ? nextTab : "resumen";
      setActiveTab(safeTab);
      requestAnimationFrame(() => syncBorderToTab(safeTab));
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [syncBorderToTab, tabs]);

  useLayoutEffect(() => {
    syncBorderToTab(activeTab);
  }, [activeTab, syncBorderToTab]);

  useEffect(() => {
    function handleResize() {
      syncBorderToTab(activeTab);
      menuRef.current?.style.setProperty("--timeOut", "none");
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [activeTab, syncBorderToTab]);

  return (
    <div data-visitor-tab-root data-active-tab={activeTab} className="visitor-tab-shell space-y-5">
      <div className="visitor-menu-wrap">
        <menu
          ref={menuRef}
          className="menu"
          aria-label="Secciones de Visitor Intelligence"
          role="tablist"
          style={
            {
              "--menuWidth": `${(referenceMenuWidthEm * tabs.length) / referenceItemCount}em`,
            } as CSSProperties
          }
        >
          {tabs.map(([key, label], index) => (
            <button
              key={key}
              ref={(node) => {
                itemRefs.current[index] = node;
              }}
              className={`menu__item ${activeTab === key ? "active" : ""}`}
              type="button"
              role="tab"
              aria-selected={activeTab === key}
              onClick={() => activateTab(key)}
            >
              <span className="icon">{label}</span>
            </button>
          ))}

          <div ref={menuBorderRef} className="menu__border" />
        </menu>

        <div className="svg-container" aria-hidden="true">
          <svg viewBox="0 0 202.9 45.5">
            <clipPath id="menu" clipPathUnits="objectBoundingBox" transform="scale(0.0049285362247413 0.021978021978022)">
              <path d="M6.7,45.5c5.7,0.1,14.1-0.4,23.3-4c5.7-2.3,9.9-5,18.1-10.5c10.7-7.1,11.8-9.2,20.6-14.3c5-2.9,9.2-5.2,15.2-7c7.1-2.1,13.3-2.3,17.6-2.1c4.2-0.2,10.5,0.1,17.6,2.1c6.1,1.8,10.2,4.1,15.2,7c8.8,5,9.9,7.1,20.6,14.3c8.3,5.5,12.4,8.2,18.1,10.5c9.2,3.6,17.6,4.2,23.3,4H6.7z" />
            </clipPath>
          </svg>
        </div>
      </div>

      {children}

      <style>{`
        .visitor-tab-shell {
          box-sizing: border-box;
          --bgColorMenu: var(--dark-button, #1e293b);
          --bgColorItem: var(--bgColorMenu);
          --duration: .7s;
        }

        .visitor-tab-shell *,
        .visitor-tab-shell *::before,
        .visitor-tab-shell *::after {
          box-sizing: inherit;
        }

        .visitor-menu-wrap {
          align-items: center;
          display: flex;
          justify-content: center;
          overflow-x: auto;
          overflow-y: visible;
          padding: 2.2em 0 0.35em;
          -webkit-tap-highlight-color: transparent;
        }

        .visitor-menu-wrap .menu {
          margin: 0;
          display: flex;
          width: var(--menuWidth, 32.05em);
          font-size: 1.05em;
          padding: 0 2.2em;
          position: relative;
          align-items: center;
          justify-content: center;
          background-color: var(--bgColorMenu);
          border-radius: 1.05em;
          flex: 0 0 auto;
          isolation: isolate;
        }

        .visitor-menu-wrap .menu__item {
          all: unset;
          flex-grow: 1;
          z-index: 100;
          display: flex;
          cursor: pointer;
          position: relative;
          border-radius: 50%;
          align-items: center;
          will-change: transform;
          justify-content: center;
          padding: 0.48em 0 0.68em;
          transition: transform var(--timeOut, var(--duration));
        }

        .visitor-menu-wrap .menu__item::before {
          content: "";
          z-index: -1;
          width: 3.35em;
          height: 3.35em;
          border-radius: 50%;
          position: absolute;
          transform: scale(0);
          transition: none;
        }

        .visitor-menu-wrap .menu__item.active {
          transform: translate3d(0, -.55em, 0);
        }

        .visitor-menu-wrap .menu__item.active::before {
          transform: scale(1);
          background-color: var(--bgColorItem);
          transition: background-color var(--duration), transform var(--duration);
        }

        .visitor-menu-wrap .icon {
          width: 6.4em;
          height: 2.2em;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          fill: transparent;
          font-size: 0.58em;
          font-weight: 800;
          line-height: 1;
          text-align: center;
          text-wrap: balance;
          stroke-width: 1pt;
          stroke-miterlimit: 10;
          stroke-linecap: round;
          stroke-linejoin: round;
          stroke-dasharray: 400;
        }

        .visitor-menu-wrap .menu__item:not(.active) .icon {
          opacity: 0.82;
        }

        .visitor-menu-wrap .menu__item.active .icon {
          animation: strok 1.5s reverse;
        }

        @keyframes strok {
          100% {
            opacity: 0.35;
          }
        }

        .visitor-menu-wrap .menu__border {
          left: 0;
          bottom: calc(100% - 2px);
          width: 8.2em;
          height: calc(1.78em + 2px);
          position: absolute;
          clip-path: url(#menu);
          will-change: transform;
          background-color: var(--bgColorMenu);
          transition: transform var(--timeOut, var(--duration));
        }

        .visitor-menu-wrap .svg-container {
          width: 0;
          height: 0;
        }

        [data-visitor-tab-root] [data-visitor-tab-panel] {
          display: none;
        }

        [data-visitor-tab-root][data-active-tab="${activeTab}"] [data-visitor-tab-panel="${activeTab}"] {
          display: block;
        }

        @media screen and (max-width: 50em) {
          .visitor-menu-wrap {
            justify-content: flex-start;
            padding-top: 2.1em;
          }

          .visitor-menu-wrap .menu {
            font-size: .74em;
          }

          .visitor-menu-wrap .icon {
            font-size: 0.58em;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .visitor-menu-wrap .menu__item,
          .visitor-menu-wrap .menu__item::before,
          .visitor-menu-wrap .menu__border {
            transition-duration: 0.01ms;
          }
        }
      `}</style>
    </div>
  );
}
