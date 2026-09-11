# Workspace navigation (SAV-11)

The header uses the Wantio mark, tag filters,
an expandable search, one Add item button and a More options disclosure. Purchased, Settings,
extension help and sign out live in that disclosure. There is no bottom navigation.
Header and content use the same width and horizontal padding. Search and More are quiet circular controls, followed by the primary Add item action. The logo returns to Wishlist; other views also expose Wishlist in the menu.
Desktop controls share one row; mobile tags occupy a second row. On mobile an open
search takes the place of the logo to make room for typing. Search
stays expanded while a query exists; clear/close restores focus to its trigger.
Escape closes an empty search. The More options disclosure closes on Escape or
outside pointer interaction. Sign out uses the existing POST endpoint.

The wishlist title remains available to assistive technology without a visible
heading. All remains fixed while other tags scroll. Counts live inside the tags
and reflect the current search.

All is the default, one tag can be selected at a time, and tag selection combines
with search. The row scrolls horizontally without widening the page, including
when a tag receives keyboard focus. TagFilters is shared with the design library.

`view`, `q`, `tag` and `item` query parameters hold the workspace state. Native
history updates integrate with Next useSearchParams without refetching the list.
Search replaces the current entry to avoid a history entry for every character;
view changes, tag choices and item openings push entries. Closing a locally opened
item goes back to its originating entry; closing a directly linked item removes
the item parameter instead of leaving the app. Detail dialogs restore card focus
without scrolling. Mutation/edit transitions replace the detail entry.

The existing product card and dialog design remain pending SAV-9 and SAV-10.
The navigation browser test checks empty/filled lists, combined filters, direct
URLs, reload, back/forward, mobile layout and detail scroll/focus restoration.
