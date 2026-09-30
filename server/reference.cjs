const REFERENCE_OBJECTS = Object.freeze({
  us_dime: { label: "US dime", kind: "us_coin", spanMm: 17.91 },
  us_penny: { label: "US penny", kind: "us_coin", spanMm: 19.05 },
  us_nickel: { label: "US nickel", kind: "us_coin", spanMm: 21.21 },
  us_quarter: { label: "US quarter", kind: "us_coin", spanMm: 24.26 },
  us_dollar_coin: { label: "US dollar coin", kind: "us_coin", spanMm: 26.5 },
  us_half_dollar: { label: "US half dollar", kind: "us_coin", spanMm: 30.61 },
  us_bill: { label: "US bill", kind: "us_bill", spanMm: 66.3 },
  ils_10_agorot: { label: "10 agorot", kind: "ils_coin", spanMm: 22 },
  ils_half_shekel: { label: "½ shekel", kind: "ils_coin", spanMm: 26 },
  ils_1_shekel: { label: "₪1 coin", kind: "ils_coin", spanMm: 18 },
  ils_2_shekel: { label: "₪2 coin", kind: "ils_coin", spanMm: 21.6 },
  ils_5_shekel: { label: "₪5 coin", kind: "ils_coin", spanMm: 24 },
  ils_10_shekel: { label: "₪10 coin", kind: "ils_coin", spanMm: 23 },
  ils_20_bill: { label: "₪20 bill", kind: "ils_bill", spanMm: 71 },
  ils_50_bill: { label: "₪50 bill", kind: "ils_bill", spanMm: 71 },
  ils_100_bill: { label: "₪100 bill", kind: "ils_bill", spanMm: 71 },
  ils_200_bill: { label: "₪200 bill", kind: "ils_bill", spanMm: 71 },
  id1_card: {
    label: "bank-card-sized card",
    kind: "id1_card",
    spanMm: 53.98,
  },
});

function getReference(referenceKey) {
  return REFERENCE_OBJECTS[referenceKey] ?? null;
}

function listReferences() {
  return Object.entries(REFERENCE_OBJECTS).map(([key, value]) => ({
    key,
    ...value,
  }));
}

module.exports = { getReference, listReferences, REFERENCE_OBJECTS };
