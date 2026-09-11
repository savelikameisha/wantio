# Workspace navigation (SAV-11)

The global header identifies Wantio. Desktop navigation lives in that header;
mobile navigation lives at the bottom with persistent labels. Only one Add item
control is visible at a time. Each view has one page title. Search and visible
tag buttons form a sticky wishlist toolbar, independent of the product grid.

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
