/** Show one dashboard panel at a time — same activeTab logic, clearer layout. */
export function showTab(
  activeTab: string,
  tab: string,
  display: 'block' | 'grid' | 'flex' | 'fill' | 'fill-grid' = 'block',
): string {
  if (activeTab !== tab) return 'hidden';
  if (display === 'fill') return 'portal-tab-surface portal-tab-surface--visible';
  if (display === 'fill-grid') return 'portal-tab-surface portal-tab-surface--grid portal-tab-surface--visible';
  return display;
}
