import { Component, computed, input, linkedSignal } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-pagination',
  imports: [RouterLink],
  templateUrl: './pagination.html',
})
export class Pagination {
  pages = input(0);
  currentPage = input(1);

  activePage = linkedSignal(() => this.currentPage())

  getPagesList = computed(() => {
    const total = this.pages()
    const current = this.activePage()

    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1)
    }

    if (current <= 3) {
      return [1, 2, 3, 4, '...', total];
    }

    if (current >= total - 2) {
      return [1, '...', total - 3, total - 2, total - 1, total]
    }

    return [1, '...', current - 1, current, current + 1, '...', total];
  })
}
