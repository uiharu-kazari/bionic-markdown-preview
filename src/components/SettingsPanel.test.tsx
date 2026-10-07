import { fireEvent, render, screen, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SettingsPanel } from './SettingsPanel';
import { LanguageProvider } from '../contexts/LanguageContext';

afterEach(() => { cleanup(); sessionStorage.clear(); });
describe('settings keyboard access', () => {
  it('names inputs, traps Tab, and restores focus after Escape', () => {
    const trigger = document.createElement('button'); document.body.append(trigger); trigger.focus();
    const close = vi.fn();
    const { unmount } = render(<LanguageProvider><SettingsPanel isOpen onClose={close}
      bionicOptions={{enabled:true, fixationPoint:3, highlightClass:'', highlightTag:'b', dimOpacity:62}}
      gradientOptions={{theme:'ocean', applyToHeadings:false, applyToLinks:false}}
      editorSettings={{fontSize:16, lineHeight:1.6, fontFamily:'monospace', previewFontFamily:'Inter', theme:'light', layout:'horizontal', panelsSwapped:false}}
      onBionicOptionsChange={vi.fn()} onGradientOptionsChange={vi.fn()} onEditorSettingsChange={vi.fn()} /></LanguageProvider>);
    expect(screen.getByRole('dialog')).toHaveAccessibleName('Settings');
    expect(screen.getByRole('slider', {name:'Leading'})).toBeInTheDocument();
    expect(screen.getByRole('combobox', {name:'Font'})).toBeInTheDocument();
    const first = screen.getByRole('button', {name:'Settings: close'});
    expect(first).toHaveFocus();
    fireEvent.keyDown(document, {key:'Tab', shiftKey:true});
    expect(screen.getByRole('link', {name:'Support'})).toHaveFocus();
    fireEvent.keyDown(document, {key:'Tab'}); expect(first).toHaveFocus();
    fireEvent.keyDown(document, {key:'Escape'}); expect(close).toHaveBeenCalledOnce();
    unmount(); expect(trigger).toHaveFocus(); trigger.remove();
  });
});
