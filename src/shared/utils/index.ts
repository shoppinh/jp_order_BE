import { HttpException, HttpStatus } from '@nestjs/common';
import { isValidPhoneNumber, parsePhoneNumber } from 'libphonenumber-js';
import { I18nContext } from 'nestjs-i18n';
import * as _ from 'lodash';
import { genSalt, hash } from 'bcryptjs';
export function isEmptyArray(objects: any) {
  if (!objects) {
    return true;
  }
  return !objects.length;
}
export function isEmptyObject(objects: any) {
  if (!objects) {
    return true;
  }
  return !Object.keys(objects).length;
}
export function isEmptyObjectOrArray(objects: any) {
  if (!objects) {
    return true;
  }
  if (Array.isArray(objects)) {
    return isEmptyArray(objects);
  }
  return isEmptyObject(objects);
}
export const isPhoneNumberValidation = (number: string) => {
  try {
    if (number.startsWith('0')) {
      number = number.replace('0', process.env.PHONE_COUNTRY_CODE_DEFAULT);
    }

    if (!number.startsWith('+')) {
      number = `+${number}`;
    }

    const codes = process.env.PHONE_COUNTRY_CODES?.split(',');
    let valid = false;
    for (const code of codes) {
      const _code = code.split('|')[0]?.toUpperCase();
      const numberParse = parsePhoneNumber(number);
      valid = numberParse.country === _code && isValidPhoneNumber(number);
      if (valid) break;
    }
    return valid;
  } catch (e) {
    return false;
  }
};
export const standardPhoneNumber = (
  number: string,
  phoneCountryCode?: string,
) => {
  number = number.trim();
  if (!number) {
    return number;
  }

  if (phoneCountryCode) {
    phoneCountryCode = phoneCountryCode.replace('+', '');
  }

  if (!number.startsWith('0') && !number.startsWith('+')) {
    number = `${
      phoneCountryCode || process.env.PHONE_COUNTRY_CODE_DEFAULT
    }${number}`;
  }

  if (number.startsWith('0')) {
    number = number.replace(
      '0',
      phoneCountryCode || process.env.PHONE_COUNTRY_CODE_DEFAULT,
    );
  }

  if (!number.startsWith('+')) {
    number = `+${number}`;
  }
  return number;
};
export const validateFields = async (
  fields: any,
  message: string,
  i18n: I18nContext,
) => {
  for (const field in fields) {
    if (
      !fields[field] ||
      ((_.isArray(fields[field]) || _.isObject(fields[field])) &&
        isEmptyObjectOrArray(fields[field]))
    ) {
      throw new HttpException(
        await i18n.translate(message, {
          args: { fieldName: field },
        }),
        HttpStatus.BAD_REQUEST,
      );
    }
  }
};
export const convertKeyRoles = (key: string) => {
  return key?.toString()?.trim()?.split(' ')?.join('_')?.toLocaleUpperCase();
};
export const passwordGenerate = async (password: string) => {
  const salt = await genSalt(10);
  return await hash(password, salt);
};
export function toListResponse(objects: any) {
  let results = {
    totalItem: 0,
    data: [],
  };
  if (!isEmptyObjectOrArray(objects[0])) {
    results = {
      totalItem: objects[1],
      data: objects[0],
    };
  }
  return results;
}

export const printLog = (...message) => {
  if (process.env.DEBUG_MODE === 'true') {
    console.log(...message);
  }
};
export const isValidEmail = (email: string) => {
  return /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(
    email,
  );
};

export const getRandomCode = (start = 100000) => {
  return Math.floor(start + Math.random() * 900000).toString();
};
export const isProductionEnv = () => {
  return (
    process.env.NODE_ENV?.toLowerCase() === 'production' ||
    process.env.NODE_ENV?.toLowerCase() === 'prod'
  );
};

export const generateSKU = (productName: string, productCategory: string) => {
  // Convert product name, category, and color to uppercase
  const productNameUpperCase = productName.toUpperCase();
  const productCategoryUpperCase = productCategory.toUpperCase();

  // Remove spaces and special characters from product name, category, and color
  const cleanProductName = productNameUpperCase.replace(/[^A-Z0-9]/g, '');
  const cleanProductCategory = productCategoryUpperCase.replace(
    /[^A-Z0-9]/g,
    '',
  );

  // Concatenate the cleaned information to form the SKU
  const SKU = `${cleanProductCategory}-${cleanProductName}`;

  return SKU;
};
