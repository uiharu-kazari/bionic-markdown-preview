/// <reference types="cypress" />

// Cypress coverage of the core editor → preview behaviours, mirroring the
// Playwright critical-path suite from a second framework: render + bionic
// emphasis, GFM table rendering, and layout stability under selection effects.

const type = (md: string) => {
  cy.get('textarea').first().clear().type(md, { delay: 0, parseSpecialCharSequences: false });
  // blur so the debounced render + bionic pass settle
  cy.get('textarea').first().blur();
  cy.wait(500);
};

describe('Bionic Markdown preview', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('renders markdown with bionic emphasis', () => {
    type('# Title\n\nReading should be faster.');
    cy.get('article h1').should('contain.text', 'Title');
    cy.get('article b').should('exist'); // bionic bold prefixes
  });

  it('renders a GFM table into real table elements', () => {
    type('| Name | Age |\n| --- | --- |\n| Alice | 30 |\n| Bob | 25 |');
    cy.get('article table').should('exist');
    cy.get('article thead th').should('have.length', 2);
    cy.get('article tbody td').should('have.length.at.least', 4);
    cy.get('article table').should('contain.text', 'Alice');
    cy.get('article table').should('contain.text', 'Bob');
  });

  it('does not render fenced code as bionic-emphasised text', () => {
    type('```\nconst x = 1;\n```');
    cy.get('article pre code').should('contain.text', 'const x = 1;');
    cy.get('article pre code b').should('not.exist');
  });

  it('placing the caret does not shift the surrounding text (layout stable)', () => {
    type('START alpha beta gamma delta epsilon zeta eta theta iota SENTINELWORD');

    const sentinel = () =>
      cy.window().then((win) => {
        const p = win.document.querySelector('article p')!;
        const spans = p.querySelectorAll('span[data-source-start]');
        const r = (spans[spans.length - 1] as HTMLElement).getBoundingClientRect();
        return { x: Math.round(r.x), y: Math.round(r.y) };
      });

    sentinel().then((before) => {
      // click near the start of the line to place the preview caret
      cy.get('article p').first().click(30, 8);
      cy.wait(300);
      sentinel().then((after) => {
        expect(Math.abs(after.x - before.x), 'horizontal shift').to.be.lte(1);
        expect(Math.abs(after.y - before.y), 'vertical shift').to.be.lte(1);
      });
    });
  });

  it('reflects an editor selection into the preview without reflowing it', () => {
    type('START alpha beta gamma delta epsilon zeta eta theta iota SENTINELWORD');

    const sentinel = () =>
      cy.window().then((win) => {
        const p = win.document.querySelector('article p')!;
        const spans = p.querySelectorAll('span[data-source-start]');
        const r = (spans[spans.length - 1] as HTMLElement).getBoundingClientRect();
        return { x: Math.round(r.x), y: Math.round(r.y) };
      });

    sentinel().then((before) => {
      cy.window().then((win) => {
        const ta = win.document.querySelector('textarea') as HTMLTextAreaElement;
        ta.focus();
        ta.setSelectionRange(0, 20);
        ta.dispatchEvent(new Event('select', { bubbles: true }));
      });
      cy.wait(400);
      sentinel().then((after) => {
        expect(Math.abs(after.x - before.x), 'horizontal shift').to.be.lte(1);
        expect(Math.abs(after.y - before.y), 'vertical shift').to.be.lte(1);
      });
    });
  });
});
