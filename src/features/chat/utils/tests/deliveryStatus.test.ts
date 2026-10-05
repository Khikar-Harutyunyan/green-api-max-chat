import {
  mapOutgoingStatus,
  shouldApplyStatus,
  getDeliveryStatusGlyph,
  getDeliveryStatusLabel,
} from '../deliveryStatus';

describe('mapOutgoingStatus', () => {
  it('passes the delivery states through', () => {
    expect(mapOutgoingStatus('sent')).toBe('sent');
    expect(mapOutgoingStatus('delivered')).toBe('delivered');
    expect(mapOutgoingStatus('read')).toBe('read');
  });

  it('maps every failure flavour to failed', () => {
    expect(mapOutgoingStatus('failed')).toBe('failed');
    expect(mapOutgoingStatus('noAccount')).toBe('failed');
    expect(mapOutgoingStatus('notInGroup')).toBe('failed');
  });
});

describe('shouldApplyStatus', () => {
  it('allows a forward move', () => {
    expect(shouldApplyStatus('sent', 'read')).toBe(true);
  });

  it('refuses to regress', () => {
    expect(shouldApplyStatus('read', 'delivered')).toBe(false);
  });

  it('always applies a failure', () => {
    expect(shouldApplyStatus('read', 'failed')).toBe(true);
  });
});

describe('getDeliveryStatusLabel', () => {
  it('describes the status in Russian', () => {
    expect(getDeliveryStatusLabel('read')).toBe('Прочитано');
  });
});

describe('getDeliveryStatusGlyph', () => {
  it('uses one tick for sent and two once delivered', () => {
    expect(getDeliveryStatusGlyph('sent')).toBe('✓');
    expect(getDeliveryStatusGlyph('delivered')).toBe('✓✓');
    expect(getDeliveryStatusGlyph('read')).toBe('✓✓');
  });

  it('marks pending and failed distinctly', () => {
    expect(getDeliveryStatusGlyph('pending')).toBe('◌');
    expect(getDeliveryStatusGlyph('failed')).toBe('!');
  });
});
