import { TestBed } from '@angular/core/testing';
import { OptionSelector } from './option-selector';

describe('OptionSelector in add mode', () => {
  it('clears the search and closes the list after choosing an option', () => {
    const fixture = TestBed.createComponent(OptionSelector);
    fixture.componentRef.setInput('mode', 'add');
    const selector = fixture.componentInstance;
    selector.isDropdownOpen.set(true);
    selector.inputValue.set('gaseosa');

    selector.onSelectOption({ id: 'p1', name: 'Gaseosa' });

    expect(selector.inputValue()).toBe('');
    expect(selector.isDropdownOpen()).toBe(false);
  });
});
