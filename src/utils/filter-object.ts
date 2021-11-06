import {AnyObject} from '@loopback/repository';

/**
 * Create new Obj from fields
 *
 * @param obj Current data
 * @param allowedFields field
 * @returns
 */
export const funcFilterObj = (obj: AnyObject, ...allowedFields: string[]) => {
  const newObj: AnyObject = {};

  Object.keys(obj).forEach(el => {
    // Check exists
    if (allowedFields.includes(el)) {
      newObj[el] = obj[el];
    }
  });
  return newObj;
};
