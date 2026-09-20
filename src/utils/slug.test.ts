import { describe, it, expect } from 'vitest';
import { generateSlug } from './slug';

describe('generateSlug', () => {
  it('handles empty or undefined titles gracefully', () => {
    expect(generateSlug('')).toBe('');
    expect(generateSlug(undefined as unknown as string)).toBe('');
  });

  it('removes parenthetical subtitles', () => {
    expect(generateSlug('FYNN (Finance You Need Now) AI Edition')).toBe('fynn-ai-edition');
  });

  it('uses concise phrase before colon', () => {
    expect(
      generateSlug('Stripe Sessions 2024: Conversation between Patrick Collison and Jensen Huang')
    ).toBe('stripe-sessions-2024');
  });

  it('uses concise phrase before comma if punchy', () => {
    expect(
      generateSlug('From Apps to Models, Transitioning to My Next Professional Journey')
    ).toBe('from-apps-to-models');
  });

  it('handles special characters, exclamation marks, and apostrophes', () => {
    expect(generateSlug("It's Official!")).toBe('its-official');
    expect(generateSlug("Docker-izing Production Quality API's")).toBe('docker-izing-production-quality-apis');
    expect(generateSlug("Pinn's Atlanta Office Opening")).toBe('pinns-atlanta-office-opening');
  });

  it('collapses multiple spaces and hyphens', () => {
    expect(generateSlug('Fynn - Fundamentals You Need Now')).toBe('fynn-fundamentals-you-need');
  });
});
