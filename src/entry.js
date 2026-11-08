/** Client entry: registers the locale dictionaries, the sidebar icon and the panel. */

export function createPlugin() {
  return {
    inject: ['slots'],
    apply(ctx) {
      // The panel renders its stylesheet itself (a <style> element inside the
      // panel), so no document-level injection is needed here.

      const locale = ctx.get('locale');
      if (locale && typeof locale.register === 'function') {
        ctx.effect(() => {
          const disposers = [];
          for (const id of Object.keys(DICTS)) {
            try {
              const dispose = locale.register('tarot', id, DICTS[id]);
              if (typeof dispose === 'function') disposers.push(dispose);
            } catch (error) {
              console.warn('[daily-tarot] could not register locale ' + id, error);
            }
          }
          return () => {
            for (const dispose of disposers) {
              try {
                dispose();
              } catch (error) {
                /* already gone */
              }
            }
          };
        });
      }

      const translator =
        locale && typeof locale.bind === 'function' ? locale.bind('tarot') : null;
      const translate = typeof translator === 'function' ? translator : makeFallbackT(DICTS.zh);

      ctx.slots.inject('sidebar.panellist', () =>
        ctx.slots.register(
          {
            name: 'sidebar.panellist',
            id: 'tarot',
            order: 20,
            label: () => translate('sidebar.label'),
          },
          TarotSidebarIcon
        )
      );

      ctx.slots.inject('main', () =>
        ctx.slots.register(
          { name: 'main', key: 'tarot' },
          () => h(TarotPanel, { t: translate, locale })
        )
      );
    }
  };
}
