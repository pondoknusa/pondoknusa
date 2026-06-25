import { Model } from '@tyravel/database';

export class Document extends Model {
  static override table = 'documents';
  static override vectorColumn = 'embedding';
}