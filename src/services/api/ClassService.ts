/**
 * Public class list (classlist collection) helpers.
 * Uses shared Appwrite client + paginated listAllDocuments.
 */

import { Query, ID } from 'appwrite'
import { databases, config, listAllDocuments } from '@/appwrite'
import { loadRelations, commonRelations } from '@/appwrite/relationHelper'

export class ClassService {
  private static instance: ClassService

  static getInstance(): ClassService {
    if (!ClassService.instance) {
      ClassService.instance = new ClassService()
    }
    return ClassService.instance
  }

  /** All classes, optionally with worker/course relations resolved. */
  async listClasses(options: { withRelations?: boolean } = {}) {
    const { withRelations = true } = options
    const result = await listAllDocuments(config.website_db, config.classlist, [
      Query.orderAsc('year'),
      Query.orderAsc('designation')
    ])

    if (!withRelations) {
      return result
    }

    const documents = await loadRelations(result.documents, commonRelations.classes)
    return { documents, total: result.total }
  }

  async createClass(data: Record<string, any> = { year: 1 }) {
    return databases.createDocument(
      config.website_db,
      config.classlist,
      ID.unique(),
      data
    )
  }

  async updateClass(id: string, data: Record<string, any>) {
    return databases.updateDocument(config.website_db, config.classlist, id, data)
  }

  async deleteClass(id: string) {
    return databases.deleteDocument(config.website_db, config.classlist, id)
  }
}

export const classService = ClassService.getInstance()
