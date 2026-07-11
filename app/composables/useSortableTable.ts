import Sortable from 'sortablejs'
import { ref, onMounted, onBeforeUnmount, type Ref } from 'vue'

export function useSortableTable<T extends { id: string; sort_order: number }>(
  tbodyRef: Ref<HTMLElement | null>,
  items: Ref<T[]>,
  onReorder: (items: T[]) => Promise<void>,
) {
  const sortableInstance = ref<Sortable | null>(null)

  function initSortable() {
    if (!tbodyRef.value) return

    sortableInstance.value = Sortable.create(tbodyRef.value, {
      handle: '.drag-handle',
      animation: 200,
      easing: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
      ghostClass: 'sortable-ghost',
      dragClass: 'sortable-drag',
      delay: 150,
      delayOnTouchOnly: true,
      onEnd: async () => {
        const reindexed = items.value.map((item, index) => ({
          ...item,
          sort_order: index,
        }))

        const changed = reindexed.filter(
          (item, i) => item.sort_order !== items.value[i]?.sort_order,
        )

        if (changed.length === 0) return

        const prevSortOrders = items.value.map(i => i.sort_order)
        reindexed.forEach((item, i) => {
          item.sort_order = prevSortOrders[i]
        })

        const sortedItems = [...reindexed].sort(
          (a, b) => a.sort_order - b.sort_order,
        )

        let updates = 0
        for (let i = 0; i < sortedItems.length; i++) {
          if (sortedItems[i].sort_order !== i) {
            sortedItems[i].sort_order = i
            updates++
          }
        }

        if (updates === 0) return

        items.value = sortedItems

        await onReorder(sortedItems)
      },
    })
  }

  onMounted(() => {
    initSortable()
  })

  onBeforeUnmount(() => {
    sortableInstance.value?.destroy()
    sortableInstance.value = null
  })

  return { sortableInstance }
}
