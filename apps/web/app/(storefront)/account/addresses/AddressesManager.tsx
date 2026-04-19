'use client';

import { useState } from 'react';

export type AccountAddress = {
  addressId: string;
  label: string;
  recipientName: string;
  line1: string;
  line2: string | null;
  city: string;
  region: string | null;
  postcode: string;
  countryIso2: string;
  phone: string | null;
  isDefaultShipping: boolean;
  isDefaultBilling: boolean;
};

type AddressFormState = Omit<AccountAddress, 'addressId' | 'isDefaultShipping' | 'isDefaultBilling'>;

const COUNTRY_MAP: Record<string, string> = {
  GB: 'United Kingdom',
  IE: 'Ireland',
  FR: 'France',
  DE: 'Germany',
  NL: 'Netherlands',
  US: 'United States',
};

const UK_POSTCODE_RE = /^[A-Z]{1,2}[0-9][A-Z0-9]?\s?[0-9][A-Z]{2}$/i;

function countryName(iso2: string) {
  return COUNTRY_MAP[iso2] ?? iso2;
}

export function AddressesManager({ initial }: { initial: AccountAddress[] }) {
  const [addresses, setAddresses] = useState<AccountAddress[]>(initial);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  function setDefaultShipping(id: string) {
    setAddresses((xs) => xs.map((a) => ({ ...a, isDefaultShipping: a.addressId === id })));
  }
  function setDefaultBilling(id: string) {
    setAddresses((xs) => xs.map((a) => ({ ...a, isDefaultBilling: a.addressId === id })));
  }
  function deleteAddress(id: string) {
    setAddresses((xs) => xs.filter((a) => a.addressId !== id));
  }

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {addresses.map((a, i) => (
          <AddressCard
            key={a.addressId}
            address={a}
            isFirst={i === 0}
            isEditing={editingId === a.addressId}
            onEdit={() => setEditingId(a.addressId)}
            onCancel={() => setEditingId(null)}
            onSave={(updated) => {
              setAddresses((xs) =>
                xs.map((x) => (x.addressId === a.addressId ? { ...x, ...updated } : x)),
              );
              setEditingId(null);
            }}
            onDelete={() => deleteAddress(a.addressId)}
            onSetDefaultShipping={() => setDefaultShipping(a.addressId)}
            onSetDefaultBilling={() => setDefaultBilling(a.addressId)}
          />
        ))}

        {addresses.length === 0 && (
          <div
            style={{
              padding: '48px 0',
              borderTop: '1px solid var(--ink-10)',
              borderBottom: '1px solid var(--ink-10)',
              textAlign: 'center',
            }}
          >
            <p style={{ margin: 0, color: 'var(--ink-60)', fontSize: 14 }}>No saved addresses yet.</p>
          </div>
        )}
      </div>

      <div style={{ marginTop: 48 }}>
        {!isAdding && (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="bav-cta-secondary"
            style={{ width: 'auto', padding: '18px 36px' }}
          >
            + Add a new address
          </button>
        )}

        {isAdding && (
          <AddressForm
            initial={null}
            onCancel={() => setIsAdding(false)}
            onSave={(a) => {
              setAddresses((xs) => [
                ...xs,
                {
                  ...a,
                  addressId: `addr_${Date.now()}`,
                  isDefaultShipping: false,
                  isDefaultBilling: false,
                },
              ]);
              setIsAdding(false);
            }}
            title="Add address"
          />
        )}
      </div>
    </>
  );
}

function AddressCard({
  address,
  isFirst,
  isEditing,
  onEdit,
  onCancel,
  onSave,
  onDelete,
  onSetDefaultShipping,
  onSetDefaultBilling,
}: {
  address: AccountAddress;
  isFirst: boolean;
  isEditing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: (updated: AddressFormState) => void;
  onDelete: () => void;
  onSetDefaultShipping: () => void;
  onSetDefaultBilling: () => void;
}) {
  if (isEditing) {
    return (
      <div
        style={{
          borderTop: isFirst ? '1px solid var(--ink-10)' : 'none',
          borderBottom: '1px solid var(--ink-10)',
          padding: '32px 0',
        }}
      >
        <AddressForm
          initial={address}
          onCancel={onCancel}
          onSave={onSave}
          title={`Edit ${address.label || 'address'}`}
        />
      </div>
    );
  }

  return (
    <div
      style={{
        borderTop: isFirst ? '1px solid var(--ink-10)' : 'none',
        borderBottom: '1px solid var(--ink-10)',
        padding: '32px 0',
        display: 'grid',
        gridTemplateColumns: '1fr auto',
        gap: 32,
        alignItems: 'start',
      }}
    >
      <div>
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 16,
            marginBottom: 12,
            flexWrap: 'wrap',
          }}
        >
          <div className="bav-label" style={{ color: 'var(--ink)' }}>
            {address.label || '— Address'}
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {address.isDefaultShipping && (
              <span
                className="font-mono"
                style={{
                  fontSize: 10,
                  textTransform: 'uppercase',
                  letterSpacing: '0.14em',
                  color: 'var(--ink-60)',
                  border: '1px solid var(--ink-10)',
                  padding: '3px 8px',
                }}
              >
                Default shipping
              </span>
            )}
            {address.isDefaultBilling && (
              <span
                className="font-mono"
                style={{
                  fontSize: 10,
                  textTransform: 'uppercase',
                  letterSpacing: '0.14em',
                  color: 'var(--ink-60)',
                  border: '1px solid var(--ink-10)',
                  padding: '3px 8px',
                }}
              >
                Default billing
              </span>
            )}
          </div>
        </div>

        <div style={{ fontSize: 15, lineHeight: 1.55, color: 'var(--ink)' }}>
          <div style={{ fontWeight: 500 }}>{address.recipientName}</div>
          <div style={{ color: 'var(--ink-60)' }}>{address.line1}</div>
          {address.line2 && <div style={{ color: 'var(--ink-60)' }}>{address.line2}</div>}
          <div style={{ color: 'var(--ink-60)' }}>
            {address.city}
            {address.region ? `, ${address.region}` : ''}
          </div>
          <div className="font-mono" style={{ color: 'var(--ink-60)', fontSize: 13 }}>
            {address.postcode}
          </div>
          <div style={{ color: 'var(--ink-60)' }}>{countryName(address.countryIso2)}</div>
          {address.phone && (
            <div className="font-mono" style={{ color: 'var(--ink-30)', fontSize: 12, marginTop: 8 }}>
              {address.phone}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 24, marginTop: 20, flexWrap: 'wrap' }}>
          {!address.isDefaultShipping && (
            <button
              type="button"
              onClick={onSetDefaultShipping}
              className="bav-hover-opa font-mono"
              style={{
                fontSize: 11,
                textTransform: 'uppercase',
                letterSpacing: '0.16em',
                color: 'var(--ink-60)',
                background: 'transparent',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
              }}
            >
              Set as default shipping
            </button>
          )}
          {!address.isDefaultBilling && (
            <button
              type="button"
              onClick={onSetDefaultBilling}
              className="bav-hover-opa font-mono"
              style={{
                fontSize: 11,
                textTransform: 'uppercase',
                letterSpacing: '0.16em',
                color: 'var(--ink-60)',
                background: 'transparent',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
              }}
            >
              Set as default billing
            </button>
          )}
        </div>
      </div>

      <div
        style={{ display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'flex-end' }}
      >
        <button
          type="button"
          onClick={onEdit}
          className="bav-hover-opa"
          style={{
            fontSize: 13,
            color: 'var(--ink)',
            background: 'transparent',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            textDecoration: 'underline',
            textUnderlineOffset: 3,
          }}
        >
          Edit
        </button>
        {!address.isDefaultShipping && !address.isDefaultBilling && (
          <button
            type="button"
            onClick={onDelete}
            className="bav-hover-opa"
            style={{
              fontSize: 13,
              color: 'var(--ink-60)',
              background: 'transparent',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              textDecoration: 'underline',
              textUnderlineOffset: 3,
            }}
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}

function AddressForm({
  initial,
  onCancel,
  onSave,
  title,
}: {
  initial: AccountAddress | null;
  onCancel: () => void;
  onSave: (a: AddressFormState) => void;
  title: string;
}) {
  const [form, setForm] = useState<AddressFormState>({
    label: initial?.label ?? '',
    recipientName: initial?.recipientName ?? '',
    line1: initial?.line1 ?? '',
    line2: initial?.line2 ?? '',
    city: initial?.city ?? '',
    region: initial?.region ?? '',
    postcode: initial?.postcode ?? '',
    countryIso2: initial?.countryIso2 ?? 'GB',
    phone: initial?.phone ?? '',
  });

  const update = <K extends keyof AddressFormState>(k: K, v: AddressFormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const postcodeValid =
    form.countryIso2 !== 'GB' || UK_POSTCODE_RE.test(form.postcode.trim());
  const canSubmit =
    form.recipientName.trim() &&
    form.line1.trim() &&
    form.city.trim() &&
    form.postcode.trim() &&
    postcodeValid;

  const labelStyle: React.CSSProperties = {
    fontSize: 10,
    letterSpacing: '0.18em',
    textTransform: 'uppercase',
    color: 'var(--ink-60)',
    marginBottom: 8,
    display: 'block',
  };
  const inputStyle: React.CSSProperties = {
    fontSize: 15,
    width: '100%',
    padding: '10px 0',
    border: 'none',
    borderBottom: '1px solid var(--ink-30)',
    background: 'transparent',
    color: 'var(--ink)',
    outline: 'none',
    fontFamily: 'inherit',
  };

  return (
    <div>
      <div
        className="font-mono"
        style={{
          fontSize: 11,
          textTransform: 'uppercase',
          letterSpacing: '0.18em',
          color: 'var(--ink-60)',
          marginBottom: 24,
        }}
      >
        — {title}
      </div>

      <div className="bav-address-grid">
        <div className="bav-col-span-2">
          <label className="font-mono" style={labelStyle}>
            Label (optional)
          </label>
          <input
            type="text"
            value={form.label}
            onChange={(e) => update('label', e.target.value)}
            placeholder="Home, Studio, Office…"
            style={inputStyle}
          />
        </div>

        <div className="bav-col-span-2">
          <label className="font-mono" style={labelStyle}>
            Recipient name
          </label>
          <input
            type="text"
            value={form.recipientName}
            onChange={(e) => update('recipientName', e.target.value)}
            style={inputStyle}
          />
        </div>

        <div className="bav-col-span-2">
          <label className="font-mono" style={labelStyle}>
            Address line 1
          </label>
          <input
            type="text"
            value={form.line1}
            onChange={(e) => update('line1', e.target.value)}
            placeholder="Street and number"
            style={inputStyle}
          />
        </div>

        <div className="bav-col-span-2">
          <label className="font-mono" style={labelStyle}>
            Address line 2 (optional)
          </label>
          <input
            type="text"
            value={form.line2 ?? ''}
            onChange={(e) => update('line2', e.target.value)}
            placeholder="Flat, unit, floor…"
            style={inputStyle}
          />
        </div>

        <div>
          <label className="font-mono" style={labelStyle}>
            Town or city
          </label>
          <input
            type="text"
            value={form.city}
            onChange={(e) => update('city', e.target.value)}
            style={inputStyle}
          />
        </div>

        <div>
          <label className="font-mono" style={labelStyle}>
            County or region
          </label>
          <input
            type="text"
            value={form.region ?? ''}
            onChange={(e) => update('region', e.target.value)}
            style={inputStyle}
          />
        </div>

        <div>
          <label className="font-mono" style={labelStyle}>
            Postcode
          </label>
          <input
            type="text"
            value={form.postcode}
            onChange={(e) => update('postcode', e.target.value.toUpperCase())}
            style={{
              ...inputStyle,
              fontSize: 14,
              letterSpacing: '0.04em',
              borderBottomColor: form.postcode && !postcodeValid ? '#B94040' : 'var(--ink-30)',
            }}
            placeholder="B15 2LG"
            className="font-mono"
          />
          {form.postcode && !postcodeValid && (
            <div
              className="font-mono"
              style={{ fontSize: 10, color: '#B94040', marginTop: 6, letterSpacing: '0.1em' }}
            >
              Check the UK postcode format
            </div>
          )}
        </div>

        <div>
          <label className="font-mono" style={labelStyle}>
            Country
          </label>
          <select
            value={form.countryIso2}
            onChange={(e) => update('countryIso2', e.target.value)}
            style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }}
          >
            <option value="GB">United Kingdom</option>
            <option value="IE">Ireland</option>
            <option value="FR">France</option>
            <option value="DE">Germany</option>
            <option value="NL">Netherlands</option>
            <option value="US">United States</option>
          </select>
        </div>

        <div className="bav-col-span-2">
          <label className="font-mono" style={labelStyle}>
            Phone (optional)
          </label>
          <input
            type="tel"
            value={form.phone ?? ''}
            onChange={(e) => update('phone', e.target.value)}
            placeholder="+44 7700 900000"
            style={{ ...inputStyle, fontSize: 14 }}
            className="font-mono"
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16, marginTop: 32, flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => canSubmit && onSave(form)}
          disabled={!canSubmit}
          className="bav-cta"
          style={{
            width: 'auto',
            padding: '18px 36px',
            opacity: canSubmit ? 1 : 0.35,
            cursor: canSubmit ? 'pointer' : 'not-allowed',
          }}
        >
          {initial ? 'Save changes' : 'Save address'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="bav-cta-secondary"
          style={{ width: 'auto', padding: '16px 36px' }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
