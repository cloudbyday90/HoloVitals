/**
 * Mayo Clinic LOINC Codes Seed Data
 * 
 * This file contains the most common lab tests from Mayo Clinic
 * with their LOINC codes, reference ranges, and units.
 * 
 * Source: Mayo Clinic Laboratories
 * LOINC Version: 2.76
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Common Lab Tests with Mayo Clinic LOINC Codes
export const mayoClinicLOINCCodes = [
  // ============================================
  // CHEMISTRY PANEL
  // ============================================
  {
    loincNumber: '2345-7',
    component: 'Glucose',
    property: 'MCnc',
    timeAspect: 'Pt',
    system: 'Ser/Plas',
    scale: 'Qn',
    category: 'LABORATORY',
    componentType: 'CHEMISTRY',
    commonName: 'Glucose',
    shortName: 'Glucose SerPl',
    longName: 'Glucose [Mass/volume] in Serum or Plasma',
    relatedNames: ['Blood Sugar', 'Blood Glucose', 'Serum Glucose'],
    units: [
      { unit: 'mg/dL', ucumCode: 'mg/dL', unitSystem: 'CONVENTIONAL', isPrimary: true },
      { unit: 'mmol/L', ucumCode: 'mmol/L', unitSystem: 'SI', conversionFactor: 0.0555 },
    ],
    referenceRanges: [
      { type: 'NORMAL', lowValue: 70, highValue: 100, unit: 'mg/dL', gender: 'ALL', source: 'Mayo Clinic' },
      { type: 'CRITICAL_LOW', lowValue: null, highValue: 50, unit: 'mg/dL', gender: 'ALL', source: 'Mayo Clinic' },
      { type: 'CRITICAL_HIGH', lowValue: 200, highValue: null, unit: 'mg/dL', gender: 'ALL', source: 'Mayo Clinic' },
    ],
  },
  {
    loincNumber: '2951-2',
    component: 'Sodium',
    property: 'SCnc',
    timeAspect: 'Pt',
    system: 'Ser/Plas',
    scale: 'Qn',
    category: 'LABORATORY',
    componentType: 'CHEMISTRY',
    commonName: 'Sodium',
    shortName: 'Sodium SerPl',
    longName: 'Sodium [Moles/volume] in Serum or Plasma',
    relatedNames: ['Na', 'Serum Sodium'],
    units: [
      { unit: 'mEq/L', ucumCode: 'meq/L', unitSystem: 'CONVENTIONAL', isPrimary: true },
      { unit: 'mmol/L', ucumCode: 'mmol/L', unitSystem: 'SI', conversionFactor: 1.0 },
    ],
    referenceRanges: [
      { type: 'NORMAL', lowValue: 136, highValue: 145, unit: 'mEq/L', gender: 'ALL', source: 'Mayo Clinic' },
      { type: 'CRITICAL_LOW', lowValue: null, highValue: 120, unit: 'mEq/L', gender: 'ALL', source: 'Mayo Clinic' },
      { type: 'CRITICAL_HIGH', lowValue: 160, highValue: null, unit: 'mEq/L', gender: 'ALL', source: 'Mayo Clinic' },
    ],
  },
  {
    loincNumber: '2823-3',
    component: 'Potassium',
    property: 'SCnc',
    timeAspect: 'Pt',
    system: 'Ser/Plas',
    scale: 'Qn',
    category: 'LABORATORY',
    componentType: 'CHEMISTRY',
    commonName: 'Potassium',
    shortName: 'Potassium SerPl',
    longName: 'Potassium [Moles/volume] in Serum or Plasma',
    relatedNames: ['K', 'Serum Potassium'],
    units: [
      { unit: 'mEq/L', ucumCode: 'meq/L', unitSystem: 'CONVENTIONAL', isPrimary: true },
      { unit: 'mmol/L', ucumCode: 'mmol/L', unitSystem: 'SI', conversionFactor: 1.0 },
    ],
    referenceRanges: [
      { type: 'NORMAL', lowValue: 3.5, highValue: 5.1, unit: 'mEq/L', gender: 'ALL', source: 'Mayo Clinic' },
      { type: 'CRITICAL_LOW', lowValue: null, highValue: 2.5, unit: 'mEq/L', gender: 'ALL', source: 'Mayo Clinic' },
      { type: 'CRITICAL_HIGH', lowValue: 6.5, highValue: null, unit: 'mEq/L', gender: 'ALL', source: 'Mayo Clinic' },
    ],
  },
  {
    loincNumber: '2075-0',
    component: 'Chloride',
    property: 'SCnc',
    timeAspect: 'Pt',
    system: 'Ser/Plas',
    scale: 'Qn',
    category: 'LABORATORY',
    componentType: 'CHEMISTRY',
    commonName: 'Chloride',
    shortName: 'Chloride SerPl',
    longName: 'Chloride [Moles/volume] in Serum or Plasma',
    relatedNames: ['Cl', 'Serum Chloride'],
    units: [
      { unit: 'mEq/L', ucumCode: 'meq/L', unitSystem: 'CONVENTIONAL', isPrimary: true },
      { unit: 'mmol/L', ucumCode: 'mmol/L', unitSystem: 'SI', conversionFactor: 1.0 },
    ],
    referenceRanges: [
      { type: 'NORMAL', lowValue: 98, highValue: 107, unit: 'mEq/L', gender: 'ALL', source: 'Mayo Clinic' },
    ],
  },
  {
    loincNumber: '2028-9',
    component: 'Carbon Dioxide',
    property: 'SCnc',
    timeAspect: 'Pt',
    system: 'Ser/Plas',
    scale: 'Qn',
    category: 'LABORATORY',
    componentType: 'CHEMISTRY',
    commonName: 'Carbon Dioxide',
    shortName: 'CO2 SerPl',
    longName: 'Carbon dioxide, total [Moles/volume] in Serum or Plasma',
    relatedNames: ['CO2', 'Bicarbonate', 'Total CO2'],
    units: [
      { unit: 'mEq/L', ucumCode: 'meq/L', unitSystem: 'CONVENTIONAL', isPrimary: true },
      { unit: 'mmol/L', ucumCode: 'mmol/L', unitSystem: 'SI', conversionFactor: 1.0 },
    ],
    referenceRanges: [
      { type: 'NORMAL', lowValue: 22, highValue: 29, unit: 'mEq/L', gender: 'ALL', source: 'Mayo Clinic' },
    ],
  },
  {
    loincNumber: '3094-0',
    component: 'Urea nitrogen',
    property: 'MCnc',
    timeAspect: 'Pt',
    system: 'Ser/Plas',
    scale: 'Qn',
    category: 'LABORATORY',
    componentType: 'CHEMISTRY',
    commonName: 'Blood Urea Nitrogen (BUN)',
    shortName: 'BUN SerPl',
    longName: 'Urea nitrogen [Mass/volume] in Serum or Plasma',
    relatedNames: ['BUN', 'Urea', 'Blood Urea'],
    units: [
      { unit: 'mg/dL', ucumCode: 'mg/dL', unitSystem: 'CONVENTIONAL', isPrimary: true },
      { unit: 'mmol/L', ucumCode: 'mmol/L', unitSystem: 'SI', conversionFactor: 0.357 },
    ],
    referenceRanges: [
      { type: 'NORMAL', lowValue: 7, highValue: 20, unit: 'mg/dL', gender: 'ALL', source: 'Mayo Clinic' },
    ],
  },
  {
    loincNumber: '2160-0',
    component: 'Creatinine',
    property: 'MCnc',
    timeAspect: 'Pt',
    system: 'Ser/Plas',
    scale: 'Qn',
    category: 'LABORATORY',
    componentType: 'CHEMISTRY',
    commonName: 'Creatinine',
    shortName: 'Creatinine SerPl',
    longName: 'Creatinine [Mass/volume] in Serum or Plasma',
    relatedNames: ['Serum Creatinine', 'SCr'],
    units: [
      { unit: 'mg/dL', ucumCode: 'mg/dL', unitSystem: 'CONVENTIONAL', isPrimary: true },
      { unit: 'umol/L', ucumCode: 'umol/L', unitSystem: 'SI', conversionFactor: 88.4 },
    ],
    referenceRanges: [
      { type: 'NORMAL', lowValue: 0.7, highValue: 1.3, unit: 'mg/dL', gender: 'MALE', source: 'Mayo Clinic' },
      { type: 'NORMAL', lowValue: 0.6, highValue: 1.1, unit: 'mg/dL', gender: 'FEMALE', source: 'Mayo Clinic' },
    ],
  },
  {
    loincNumber: '33914-3',
    component: 'Glomerular filtration rate',
    property: 'VRat',
    timeAspect: 'Pt',
    system: 'Ser/Plas/Bld',
    scale: 'Qn',
    category: 'LABORATORY',
    componentType: 'CHEMISTRY',
    commonName: 'eGFR',
    shortName: 'eGFR',
    longName: 'Glomerular filtration rate/1.73 sq M.predicted',
    relatedNames: ['GFR', 'Estimated GFR', 'Kidney Function'],
    units: [
      { unit: 'mL/min/1.73m2', ucumCode: 'mL/min/{1.73_m2}', unitSystem: 'CONVENTIONAL', isPrimary: true },
    ],
    referenceRanges: [
      { type: 'NORMAL', lowValue: 60, highValue: null, unit: 'mL/min/1.73m2', gender: 'ALL', source: 'Mayo Clinic' },
    ],
  },

  // ============================================
  // LIVER FUNCTION TESTS
  // ============================================
  {
    loincNumber: '1742-6',
    component: 'Alanine aminotransferase',
    property: 'CCnc',
    timeAspect: 'Pt',
    system: 'Ser/Plas',
    scale: 'Qn',
    category: 'LABORATORY',
    componentType: 'CHEMISTRY',
    commonName: 'ALT (SGPT)',
    shortName: 'ALT SerPl',
    longName: 'Alanine aminotransferase [Enzymatic activity/volume] in Serum or Plasma',
    relatedNames: ['ALT', 'SGPT', 'Alanine Transaminase'],
    units: [
      { unit: 'U/L', ucumCode: 'U/L', unitSystem: 'CONVENTIONAL', isPrimary: true },
    ],
    referenceRanges: [
      { type: 'NORMAL', lowValue: 7, highValue: 56, unit: 'U/L', gender: 'MALE', source: 'Mayo Clinic' },
      { type: 'NORMAL', lowValue: 7, highValue: 45, unit: 'U/L', gender: 'FEMALE', source: 'Mayo Clinic' },
    ],
  },
  {
    loincNumber: '1920-8',
    component: 'Aspartate aminotransferase',
    property: 'CCnc',
    timeAspect: 'Pt',
    system: 'Ser/Plas',
    scale: 'Qn',
    category: 'LABORATORY',
    componentType: 'CHEMISTRY',
    commonName: 'AST (SGOT)',
    shortName: 'AST SerPl',
    longName: 'Aspartate aminotransferase [Enzymatic activity/volume] in Serum or Plasma',
    relatedNames: ['AST', 'SGOT', 'Aspartate Transaminase'],
    units: [
      { unit: 'U/L', ucumCode: 'U/L', unitSystem: 'CONVENTIONAL', isPrimary: true },
    ],
    referenceRanges: [
      { type: 'NORMAL', lowValue: 10, highValue: 40, unit: 'U/L', gender: 'ALL', source: 'Mayo Clinic' },
    ],
  },
  {
    loincNumber: '1975-2',
    component: 'Bilirubin.total',
    property: 'MCnc',
    timeAspect: 'Pt',
    system: 'Ser/Plas',
    scale: 'Qn',
    category: 'LABORATORY',
    componentType: 'CHEMISTRY',
    commonName: 'Bilirubin, Total',
    shortName: 'Bili Total SerPl',
    longName: 'Bilirubin.total [Mass/volume] in Serum or Plasma',
    relatedNames: ['Total Bilirubin', 'TBIL'],
    units: [
      { unit: 'mg/dL', ucumCode: 'mg/dL', unitSystem: 'CONVENTIONAL', isPrimary: true },
      { unit: 'umol/L', ucumCode: 'umol/L', unitSystem: 'SI', conversionFactor: 17.1 },
    ],
    referenceRanges: [
      { type: 'NORMAL', lowValue: 0.1, highValue: 1.2, unit: 'mg/dL', gender: 'ALL', source: 'Mayo Clinic' },
    ],
  },
  {
    loincNumber: '6768-6',
    component: 'Alkaline phosphatase',
    property: 'CCnc',
    timeAspect: 'Pt',
    system: 'Ser/Plas',
    scale: 'Qn',
    category: 'LABORATORY',
    componentType: 'CHEMISTRY',
    commonName: 'Alkaline Phosphatase',
    shortName: 'ALP SerPl',
    longName: 'Alkaline phosphatase [Enzymatic activity/volume] in Serum or Plasma',
    relatedNames: ['ALP', 'Alk Phos'],
    units: [
      { unit: 'U/L', ucumCode: 'U/L', unitSystem: 'CONVENTIONAL', isPrimary: true },
    ],
    referenceRanges: [
      { type: 'NORMAL', lowValue: 40, highValue: 130, unit: 'U/L', gender: 'ALL', source: 'Mayo Clinic' },
    ],
  },
  {
    loincNumber: '2885-2',
    component: 'Protein.total',
    property: 'MCnc',
    timeAspect: 'Pt',
    system: 'Ser/Plas',
    scale: 'Qn',
    category: 'LABORATORY',
    componentType: 'CHEMISTRY',
    commonName: 'Total Protein',
    shortName: 'Protein Total SerPl',
    longName: 'Protein [Mass/volume] in Serum or Plasma',
    relatedNames: ['Total Protein', 'TP'],
    units: [
      { unit: 'g/dL', ucumCode: 'g/dL', unitSystem: 'CONVENTIONAL', isPrimary: true },
      { unit: 'g/L', ucumCode: 'g/L', unitSystem: 'SI', conversionFactor: 10.0 },
    ],
    referenceRanges: [
      { type: 'NORMAL', lowValue: 6.0, highValue: 8.3, unit: 'g/dL', gender: 'ALL', source: 'Mayo Clinic' },
    ],
  },
  {
    loincNumber: '1751-7',
    component: 'Albumin',
    property: 'MCnc',
    timeAspect: 'Pt',
    system: 'Ser/Plas',
    scale: 'Qn',
    category: 'LABORATORY',
    componentType: 'CHEMISTRY',
    commonName: 'Albumin',
    shortName: 'Albumin SerPl',
    longName: 'Albumin [Mass/volume] in Serum or Plasma',
    relatedNames: ['Serum Albumin'],
    units: [
      { unit: 'g/dL', ucumCode: 'g/dL', unitSystem: 'CONVENTIONAL', isPrimary: true },
      { unit: 'g/L', ucumCode: 'g/L', unitSystem: 'SI', conversionFactor: 10.0 },
    ],
    referenceRanges: [
      { type: 'NORMAL', lowValue: 3.5, highValue: 5.5, unit: 'g/dL', gender: 'ALL', source: 'Mayo Clinic' },
    ],
  },

  // ============================================
  // LIPID PANEL
  // ============================================
  {
    loincNumber: '2093-3',
    component: 'Cholesterol.total',
    property: 'MCnc',
    timeAspect: 'Pt',
    system: 'Ser/Plas',
    scale: 'Qn',
    category: 'LABORATORY',
    componentType: 'CHEMISTRY',
    commonName: 'Total Cholesterol',
    shortName: 'Cholesterol SerPl',
    longName: 'Cholesterol [Mass/volume] in Serum or Plasma',
    relatedNames: ['Total Cholesterol', 'Cholesterol'],
    units: [
      { unit: 'mg/dL', ucumCode: 'mg/dL', unitSystem: 'CONVENTIONAL', isPrimary: true },
      { unit: 'mmol/L', ucumCode: 'mmol/L', unitSystem: 'SI', conversionFactor: 0.0259 },
    ],
    referenceRanges: [
      { type: 'NORMAL', lowValue: null, highValue: 200, unit: 'mg/dL', gender: 'ALL', source: 'Mayo Clinic' },
    ],
  },
  {
    loincNumber: '2085-9',
    component: 'Cholesterol in HDL',
    property: 'MCnc',
    timeAspect: 'Pt',
    system: 'Ser/Plas',
    scale: 'Qn',
    category: 'LABORATORY',
    componentType: 'CHEMISTRY',
    commonName: 'HDL Cholesterol',
    shortName: 'HDL SerPl',
    longName: 'Cholesterol in HDL [Mass/volume] in Serum or Plasma',
    relatedNames: ['HDL', 'Good Cholesterol', 'HDL-C'],
    units: [
      { unit: 'mg/dL', ucumCode: 'mg/dL', unitSystem: 'CONVENTIONAL', isPrimary: true },
      { unit: 'mmol/L', ucumCode: 'mmol/L', unitSystem: 'SI', conversionFactor: 0.0259 },
    ],
    referenceRanges: [
      { type: 'NORMAL', lowValue: 40, highValue: null, unit: 'mg/dL', gender: 'MALE', source: 'Mayo Clinic' },
      { type: 'NORMAL', lowValue: 50, highValue: null, unit: 'mg/dL', gender: 'FEMALE', source: 'Mayo Clinic' },
    ],
  },
  {
    loincNumber: '2089-1',
    component: 'Cholesterol in LDL',
    property: 'MCnc',
    timeAspect: 'Pt',
    system: 'Ser/Plas',
    scale: 'Qn',
    category: 'LABORATORY',
    componentType: 'CHEMISTRY',
    commonName: 'LDL Cholesterol',
    shortName: 'LDL SerPl',
    longName: 'Cholesterol in LDL [Mass/volume] in Serum or Plasma',
    relatedNames: ['LDL', 'Bad Cholesterol', 'LDL-C'],
    units: [
      { unit: 'mg/dL', ucumCode: 'mg/dL', unitSystem: 'CONVENTIONAL', isPrimary: true },
      { unit: 'mmol/L', ucumCode: 'mmol/L', unitSystem: 'SI', conversionFactor: 0.0259 },
    ],
    referenceRanges: [
      { type: 'NORMAL', lowValue: null, highValue: 100, unit: 'mg/dL', gender: 'ALL', source: 'Mayo Clinic' },
    ],
  },
  {
    loincNumber: '2571-8',
    component: 'Triglyceride',
    property: 'MCnc',
    timeAspect: 'Pt',
    system: 'Ser/Plas',
    scale: 'Qn',
    category: 'LABORATORY',
    componentType: 'CHEMISTRY',
    commonName: 'Triglycerides',
    shortName: 'Triglyceride SerPl',
    longName: 'Triglyceride [Mass/volume] in Serum or Plasma',
    relatedNames: ['Triglycerides', 'TG'],
    units: [
      { unit: 'mg/dL', ucumCode: 'mg/dL', unitSystem: 'CONVENTIONAL', isPrimary: true },
      { unit: 'mmol/L', ucumCode: 'mmol/L', unitSystem: 'SI', conversionFactor: 0.0113 },
    ],
    referenceRanges: [
      { type: 'NORMAL', lowValue: null, highValue: 150, unit: 'mg/dL', gender: 'ALL', source: 'Mayo Clinic' },
    ],
  },

  // ============================================
  // COMPLETE BLOOD COUNT (CBC)
  // ============================================
  {
    loincNumber: '6690-2',
    component: 'Leukocytes',
    property: 'NCnc',
    timeAspect: 'Pt',
    system: 'Bld',
    scale: 'Qn',
    category: 'LABORATORY',
    componentType: 'HEMATOLOGY',
    commonName: 'White Blood Cell Count',
    shortName: 'WBC Bld',
    longName: 'Leukocytes [#/volume] in Blood',
    relatedNames: ['WBC', 'White Blood Cells', 'Leukocyte Count'],
    units: [
      { unit: 'K/uL', ucumCode: '10*3/uL', unitSystem: 'CONVENTIONAL', isPrimary: true },
      { unit: '10^9/L', ucumCode: '10*9/L', unitSystem: 'SI', conversionFactor: 1.0 },
    ],
    referenceRanges: [
      { type: 'NORMAL', lowValue: 4.5, highValue: 11.0, unit: 'K/uL', gender: 'ALL', source: 'Mayo Clinic' },
      { type: 'CRITICAL_LOW', lowValue: null, highValue: 2.0, unit: 'K/uL', gender: 'ALL', source: 'Mayo Clinic' },
      { type: 'CRITICAL_HIGH', lowValue: 30.0, highValue: null, unit: 'K/uL', gender: 'ALL', source: 'Mayo Clinic' },
    ],
  },
  {
    loincNumber: '789-8',
    component: 'Erythrocytes',
    property: 'NCnc',
    timeAspect: 'Pt',
    system: 'Bld',
    scale: 'Qn',
    category: 'LABORATORY',
    componentType: 'HEMATOLOGY',
    commonName: 'Red Blood Cell Count',
    shortName: 'RBC Bld',
    longName: 'Erythrocytes [#/volume] in Blood',
    relatedNames: ['RBC', 'Red Blood Cells', 'Erythrocyte Count'],
    units: [
      { unit: 'M/uL', ucumCode: '10*6/uL', unitSystem: 'CONVENTIONAL', isPrimary: true },
      { unit: '10^12/L', ucumCode: '10*12/L', unitSystem: 'SI', conversionFactor: 1.0 },
    ],
    referenceRanges: [
      { type: 'NORMAL', lowValue: 4.5, highValue: 5.9, unit: 'M/uL', gender: 'MALE', source: 'Mayo Clinic' },
      { type: 'NORMAL', lowValue: 4.0, highValue: 5.2, unit: 'M/uL', gender: 'FEMALE', source: 'Mayo Clinic' },
    ],
  },
  {
    loincNumber: '718-7',
    component: 'Hemoglobin',
    property: 'MCnc',
    timeAspect: 'Pt',
    system: 'Bld',
    scale: 'Qn',
    category: 'LABORATORY',
    componentType: 'HEMATOLOGY',
    commonName: 'Hemoglobin',
    shortName: 'Hgb Bld',
    longName: 'Hemoglobin [Mass/volume] in Blood',
    relatedNames: ['Hgb', 'Hb', 'Hemoglobin'],
    units: [
      { unit: 'g/dL', ucumCode: 'g/dL', unitSystem: 'CONVENTIONAL', isPrimary: true },
      { unit: 'g/L', ucumCode: 'g/L', unitSystem: 'SI', conversionFactor: 10.0 },
    ],
    referenceRanges: [
      { type: 'NORMAL', lowValue: 13.5, highValue: 17.5, unit: 'g/dL', gender: 'MALE', source: 'Mayo Clinic' },
      { type: 'NORMAL', lowValue: 12.0, highValue: 15.5, unit: 'g/dL', gender: 'FEMALE', source: 'Mayo Clinic' },
      { type: 'CRITICAL_LOW', lowValue: null, highValue: 7.0, unit: 'g/dL', gender: 'ALL', source: 'Mayo Clinic' },
    ],
  },
  {
    loincNumber: '4544-3',
    component: 'Hematocrit',
    property: 'VFr',
    timeAspect: 'Pt',
    system: 'Bld',
    scale: 'Qn',
    category: 'LABORATORY',
    componentType: 'HEMATOLOGY',
    commonName: 'Hematocrit',
    shortName: 'Hct Bld',
    longName: 'Hematocrit [Volume Fraction] of Blood',
    relatedNames: ['Hct', 'HCT', 'Packed Cell Volume'],
    units: [
      { unit: '%', ucumCode: '%', unitSystem: 'CONVENTIONAL', isPrimary: true },
    ],
    referenceRanges: [
      { type: 'NORMAL', lowValue: 38.3, highValue: 48.6, unit: '%', gender: 'MALE', source: 'Mayo Clinic' },
      { type: 'NORMAL', lowValue: 35.5, highValue: 44.9, unit: '%', gender: 'FEMALE', source: 'Mayo Clinic' },
    ],
  },
  {
    loincNumber: '777-3',
    component: 'Platelets',
    property: 'NCnc',
    timeAspect: 'Pt',
    system: 'Bld',
    scale: 'Qn',
    category: 'LABORATORY',
    componentType: 'HEMATOLOGY',
    commonName: 'Platelet Count',
    shortName: 'Platelets Bld',
    longName: 'Platelets [#/volume] in Blood',
    relatedNames: ['PLT', 'Platelet Count', 'Thrombocytes'],
    units: [
      { unit: 'K/uL', ucumCode: '10*3/uL', unitSystem: 'CONVENTIONAL', isPrimary: true },
      { unit: '10^9/L', ucumCode: '10*9/L', unitSystem: 'SI', conversionFactor: 1.0 },
    ],
    referenceRanges: [
      { type: 'NORMAL', lowValue: 150, highValue: 400, unit: 'K/uL', gender: 'ALL', source: 'Mayo Clinic' },
      { type: 'CRITICAL_LOW', lowValue: null, highValue: 50, unit: 'K/uL', gender: 'ALL', source: 'Mayo Clinic' },
    ],
  },

  // ============================================
  // THYROID PANEL
  // ============================================
  {
    loincNumber: '3016-3',
    component: 'Thyrotropin',
    property: 'SCnc',
    timeAspect: 'Pt',
    system: 'Ser/Plas',
    scale: 'Qn',
    category: 'LABORATORY',
    componentType: 'CHEMISTRY',
    commonName: 'TSH',
    shortName: 'TSH SerPl',
    longName: 'Thyrotropin [Units/volume] in Serum or Plasma',
    relatedNames: ['TSH', 'Thyroid Stimulating Hormone'],
    units: [
      { unit: 'uIU/mL', ucumCode: 'u[IU]/mL', unitSystem: 'CONVENTIONAL', isPrimary: true },
      { unit: 'mIU/L', ucumCode: 'm[IU]/L', unitSystem: 'SI', conversionFactor: 1.0 },
    ],
    referenceRanges: [
      { type: 'NORMAL', lowValue: 0.4, highValue: 4.0, unit: 'uIU/mL', gender: 'ALL', source: 'Mayo Clinic' },
    ],
  },
  {
    loincNumber: '3051-0',
    component: 'Thyroxine (T4) free',
    property: 'MCnc',
    timeAspect: 'Pt',
    system: 'Ser/Plas',
    scale: 'Qn',
    category: 'LABORATORY',
    componentType: 'CHEMISTRY',
    commonName: 'Free T4',
    shortName: 'Free T4 SerPl',
    longName: 'Thyroxine (T4) free [Mass/volume] in Serum or Plasma',
    relatedNames: ['Free T4', 'FT4'],
    units: [
      { unit: 'ng/dL', ucumCode: 'ng/dL', unitSystem: 'CONVENTIONAL', isPrimary: true },
      { unit: 'pmol/L', ucumCode: 'pmol/L', unitSystem: 'SI', conversionFactor: 12.87 },
    ],
    referenceRanges: [
      { type: 'NORMAL', lowValue: 0.8, highValue: 1.8, unit: 'ng/dL', gender: 'ALL', source: 'Mayo Clinic' },
    ],
  },
  {
    loincNumber: '3053-6',
    component: 'Triiodothyronine (T3) free',
    property: 'MCnc',
    timeAspect: 'Pt',
    system: 'Ser/Plas',
    scale: 'Qn',
    category: 'LABORATORY',
    componentType: 'CHEMISTRY',
    commonName: 'Free T3',
    shortName: 'Free T3 SerPl',
    longName: 'Triiodothyronine (T3) free [Mass/volume] in Serum or Plasma',
    relatedNames: ['Free T3', 'FT3'],
    units: [
      { unit: 'pg/mL', ucumCode: 'pg/mL', unitSystem: 'CONVENTIONAL', isPrimary: true },
      { unit: 'pmol/L', ucumCode: 'pmol/L', unitSystem: 'SI', conversionFactor: 1.536 },
    ],
    referenceRanges: [
      { type: 'NORMAL', lowValue: 2.3, highValue: 4.2, unit: 'pg/mL', gender: 'ALL', source: 'Mayo Clinic' },
    ],
  },

  // ============================================
  // HEMOGLOBIN A1C
  // ============================================
  {
    loincNumber: '4548-4',
    component: 'Hemoglobin A1c',
    property: 'MFr',
    timeAspect: 'Pt',
    system: 'Bld',
    scale: 'Qn',
    category: 'LABORATORY',
    componentType: 'CHEMISTRY',
    commonName: 'Hemoglobin A1c',
    shortName: 'HbA1c Bld',
    longName: 'Hemoglobin A1c/Hemoglobin.total in Blood',
    relatedNames: ['HbA1c', 'A1C', 'Glycated Hemoglobin'],
    units: [
      { unit: '%', ucumCode: '%', unitSystem: 'CONVENTIONAL', isPrimary: true },
    ],
    referenceRanges: [
      { type: 'NORMAL', lowValue: null, highValue: 5.7, unit: '%', gender: 'ALL', source: 'Mayo Clinic' },
    ],
  },

  // ============================================
  // VITAMIN D
  // ============================================
  {
    loincNumber: '1989-3',
    component: '25-Hydroxyvitamin D3',
    property: 'MCnc',
    timeAspect: 'Pt',
    system: 'Ser/Plas',
    scale: 'Qn',
    category: 'LABORATORY',
    componentType: 'CHEMISTRY',
    commonName: 'Vitamin D, 25-Hydroxy',
    shortName: 'Vit D SerPl',
    longName: '25-Hydroxyvitamin D3 [Mass/volume] in Serum or Plasma',
    relatedNames: ['Vitamin D', '25-OH Vitamin D', 'Calcidiol'],
    units: [
      { unit: 'ng/mL', ucumCode: 'ng/mL', unitSystem: 'CONVENTIONAL', isPrimary: true },
      { unit: 'nmol/L', ucumCode: 'nmol/L', unitSystem: 'SI', conversionFactor: 2.496 },
    ],
    referenceRanges: [
      { type: 'NORMAL', lowValue: 30, highValue: 100, unit: 'ng/mL', gender: 'ALL', source: 'Mayo Clinic' },
    ],
  },

  // ============================================
  // IRON STUDIES
  // ============================================
  {
    loincNumber: '2498-4',
    component: 'Iron',
    property: 'MCnc',
    timeAspect: 'Pt',
    system: 'Ser/Plas',
    scale: 'Qn',
    category: 'LABORATORY',
    componentType: 'CHEMISTRY',
    commonName: 'Iron',
    shortName: 'Iron SerPl',
    longName: 'Iron [Mass/volume] in Serum or Plasma',
    relatedNames: ['Serum Iron', 'Fe'],
    units: [
      { unit: 'ug/dL', ucumCode: 'ug/dL', unitSystem: 'CONVENTIONAL', isPrimary: true },
      { unit: 'umol/L', ucumCode: 'umol/L', unitSystem: 'SI', conversionFactor: 0.179 },
    ],
    referenceRanges: [
      { type: 'NORMAL', lowValue: 60, highValue: 170, unit: 'ug/dL', gender: 'MALE', source: 'Mayo Clinic' },
      { type: 'NORMAL', lowValue: 50, highValue: 150, unit: 'ug/dL', gender: 'FEMALE', source: 'Mayo Clinic' },
    ],
  },
  {
    loincNumber: '2502-3',
    component: 'Iron binding capacity.total',
    property: 'MCnc',
    timeAspect: 'Pt',
    system: 'Ser/Plas',
    scale: 'Qn',
    category: 'LABORATORY',
    componentType: 'CHEMISTRY',
    commonName: 'TIBC',
    shortName: 'TIBC SerPl',
    longName: 'Iron binding capacity [Mass/volume] in Serum or Plasma',
    relatedNames: ['TIBC', 'Total Iron Binding Capacity'],
    units: [
      { unit: 'ug/dL', ucumCode: 'ug/dL', unitSystem: 'CONVENTIONAL', isPrimary: true },
      { unit: 'umol/L', ucumCode: 'umol/L', unitSystem: 'SI', conversionFactor: 0.179 },
    ],
    referenceRanges: [
      { type: 'NORMAL', lowValue: 250, highValue: 450, unit: 'ug/dL', gender: 'ALL', source: 'Mayo Clinic' },
    ],
  },
  {
    loincNumber: '2276-4',
    component: 'Ferritin',
    property: 'MCnc',
    timeAspect: 'Pt',
    system: 'Ser/Plas',
    scale: 'Qn',
    category: 'LABORATORY',
    componentType: 'CHEMISTRY',
    commonName: 'Ferritin',
    shortName: 'Ferritin SerPl',
    longName: 'Ferritin [Mass/volume] in Serum or Plasma',
    relatedNames: ['Serum Ferritin'],
    units: [
      { unit: 'ng/mL', ucumCode: 'ng/mL', unitSystem: 'CONVENTIONAL', isPrimary: true },
      { unit: 'ug/L', ucumCode: 'ug/L', unitSystem: 'SI', conversionFactor: 1.0 },
    ],
    referenceRanges: [
      { type: 'NORMAL', lowValue: 24, highValue: 336, unit: 'ng/mL', gender: 'MALE', source: 'Mayo Clinic' },
      { type: 'NORMAL', lowValue: 11, highValue: 307, unit: 'ng/mL', gender: 'FEMALE', source: 'Mayo Clinic' },
    ],
  },

  // ============================================
  // COAGULATION
  // ============================================
  {
    loincNumber: '5902-2',
    component: 'Prothrombin time',
    property: 'Time',
    timeAspect: 'Pt',
    system: 'PPP',
    scale: 'Qn',
    category: 'LABORATORY',
    componentType: 'HEMATOLOGY',
    commonName: 'Prothrombin Time',
    shortName: 'PT',
    longName: 'Prothrombin time (PT)',
    relatedNames: ['PT', 'Protime'],
    units: [
      { unit: 'sec', ucumCode: 's', unitSystem: 'CONVENTIONAL', isPrimary: true },
    ],
    referenceRanges: [
      { type: 'NORMAL', lowValue: 11.0, highValue: 13.5, unit: 'sec', gender: 'ALL', source: 'Mayo Clinic' },
    ],
  },
  {
    loincNumber: '6301-6',
    component: 'INR',
    property: 'Ratio',
    timeAspect: 'Pt',
    system: 'PPP',
    scale: 'Qn',
    category: 'LABORATORY',
    componentType: 'HEMATOLOGY',
    commonName: 'INR',
    shortName: 'INR',
    longName: 'INR in Platelet poor plasma by Coagulation assay',
    relatedNames: ['International Normalized Ratio'],
    units: [
      { unit: 'ratio', ucumCode: '{ratio}', unitSystem: 'CONVENTIONAL', isPrimary: true },
    ],
    referenceRanges: [
      { type: 'NORMAL', lowValue: 0.8, highValue: 1.2, unit: 'ratio', gender: 'ALL', source: 'Mayo Clinic' },
      { type: 'THERAPEUTIC', lowValue: 2.0, highValue: 3.0, unit: 'ratio', gender: 'ALL', condition: 'Anticoagulation', source: 'Mayo Clinic' },
    ],
  },
  {
    loincNumber: '3173-2',
    component: 'aPTT',
    property: 'Time',
    timeAspect: 'Pt',
    system: 'PPP',
    scale: 'Qn',
    category: 'LABORATORY',
    componentType: 'HEMATOLOGY',
    commonName: 'aPTT',
    shortName: 'aPTT',
    longName: 'Activated partial thromboplastin time (aPTT)',
    relatedNames: ['PTT', 'Partial Thromboplastin Time'],
    units: [
      { unit: 'sec', ucumCode: 's', unitSystem: 'CONVENTIONAL', isPrimary: true },
    ],
    referenceRanges: [
      { type: 'NORMAL', lowValue: 25, highValue: 35, unit: 'sec', gender: 'ALL', source: 'Mayo Clinic' },
    ],
  },
];

export async function seedMayoClinicLOINCCodes() {
  console.log('Seeding Mayo Clinic LOINC codes...');

  for (const codeData of mayoClinicLOINCCodes) {
    const { units, referenceRanges, ...loincData } = codeData;

    // Create LOINC code
    const loincCode = await prisma.lOINCCode.upsert({
      where: { loincNumber: loincData.loincNumber },
      update: loincData,
      create: loincData,
    });

    console.log(`✓ Created LOINC code: ${loincCode.loincNumber} - ${loincCode.commonName}`);

    // Create units
    for (const unitData of units) {
      await prisma.lOINCUnit.upsert({
        where: {
          loincCodeId_unit: {
            loincCodeId: loincCode.id,
            unit: unitData.unit,
          },
        },
        update: unitData,
        create: {
          ...unitData,
          loincCodeId: loincCode.id,
        },
      });
    }

    // Create reference ranges
    for (const rangeData of referenceRanges) {
      await prisma.referenceRange.create({
        data: {
          ...rangeData,
          loincCodeId: loincCode.id,
        },
      });
    }
  }

  console.log(`✓ Seeded ${mayoClinicLOINCCodes.length} Mayo Clinic LOINC codes`);
}