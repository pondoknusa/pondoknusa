import type { Model } from '../model.js';
import type { ModelStatic } from '../model-types.js';
import type { RowValue } from '../types.js';
import { Relation } from './relation.js';

export class BelongsToManyRelation<Related extends Model = Model> extends Relation<Related> {
  constructor(
    parent: Model,
    relatedModel: ModelStatic,
    private readonly pivotTable: string,
    private readonly foreignPivotKey: string,
    private readonly relatedPivotKey: string,
    private readonly parentKey: string,
    private readonly relatedKey: string,
  ) {
    super(parent, relatedModel);
  }

  async get(): Promise<Related[]> {
    const parentId = this.parent.getAttribute(this.parentKey as never) as RowValue;
    if (parentId === undefined || parentId === null) {
      return [];
    }

    const grammar = this.relatedModel.getConnection().grammar;
    const relatedTable = this.relatedModel.table;
    const pivot = grammar.wrapIdentifier(this.pivotTable);
    const related = grammar.wrapIdentifier(relatedTable);

    const sql = `
      SELECT ${related}.*
      FROM ${related}
      INNER JOIN ${pivot}
        ON ${related}.${grammar.wrapIdentifier(this.relatedKey)}
         = ${pivot}.${grammar.wrapIdentifier(this.relatedPivotKey)}
      WHERE ${pivot}.${grammar.wrapIdentifier(this.foreignPivotKey)} = ${grammar.parameter(1)}
    `;

    const result = await this.relatedModel.getConnection().query(sql, [parentId]);
    const ModelClass = this.relatedModel as new (
      attributes?: Record<string, unknown>,
    ) => Related;

    return result.rows.map((row) => new ModelClass(row));
  }
}