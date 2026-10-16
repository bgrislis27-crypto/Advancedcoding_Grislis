/* Line icons drawn in the page. No icon font or CDN. */
(function (SH) {
  const paths = {
    dashboard:
      '<rect x="3.5" y="3.5" width="7" height="7" rx="1.6"></rect><rect x="13.5" y="3.5" width="7" height="7" rx="1.6"></rect><rect x="3.5" y="13.5" width="7" height="7" rx="1.6"></rect><rect x="13.5" y="13.5" width="7" height="7" rx="1.6"></rect>',
    assignments:
      '<rect x="4" y="4" width="16" height="16" rx="3"></rect><path d="M8.5 12.2l2.3 2.3 4.7-5"></path>',
    calendar:
      '<rect x="3.5" y="5" width="17" height="15.5" rx="2"></rect><path d="M3.5 10h17M8 3.5v4M16 3.5v4"></path>',
    timer: '<circle cx="12" cy="13" r="7.5"></circle><path d="M12 13V9.5M12 13l2.4 1.6M9 3.5h6M12 3.5V5"></path>',
    grades:
      '<rect x="5" y="3.5" width="14" height="17" rx="2"></rect><path d="M8.5 8h7M8.5 12h7M8.5 16h4"></path>',
    sun: '<circle cx="12" cy="12" r="3.5"></circle><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.2 5.2l1.4 1.4M17.4 17.4l1.4 1.4M18.8 5.2l-1.4 1.4M6.6 17.4l-1.4 1.4"></path>',
    moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4 6.4 6.4 0 0 0 20 14.5z"></path>',
    plus: '<path d="M12 5v14M5 12h14"></path>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"></path>',
    edit: '<path d="M4 20h4l11-11-4-4L4 16v4z"></path><path d="M13 7l4 4"></path>',
    trash: '<path d="M4.5 7h15M9 7V5h6v2M8 7l.8 12h6.4L16 7"></path>',
    check: '<path d="M5 12.5l4.2 4.2L19 7.2"></path>',
    close: '<path d="M6 6l12 12M18 6L6 18"></path>',
    chevronLeft: '<path d="M14.5 6.5L9 12l5.5 5.5"></path>',
    chevronRight: '<path d="M9.5 6.5L15 12l-5.5 5.5"></path>',
    alert: '<path d="M12 8.5v5"></path><path d="M12 17h.01"></path><path d="M10.4 4.8L3.2 18a2 2 0 0 0 1.8 3h14a2 2 0 0 0 1.8-3l-7.2-13.2a2 2 0 0 0-3.2 0z"></path>',
    inbox: '<path d="M4 13l2.2-7h11.6L20 13"></path><path d="M4 13h4.2l1 2.5h5.6l1-2.5H20v5.2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V13z"></path>',
  };

  SH.icon = function icon(name) {
    return `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${paths[name] || ""}</svg>`;
  };
})(window.StudyHub = window.StudyHub || {});
