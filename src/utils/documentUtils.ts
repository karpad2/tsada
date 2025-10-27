import moment from 'moment/min/moment-with-locales';
import { useLoadingStore } from "@/stores/loading";
import { convertifserbian } from "@/lang";
import { Databases, ID, Query } from "appwrite";
import { appw, config } from "@/appwrite";

export interface DocumentItem {
    id: string;
    doc_id: string;
    name: string;
    date: string;
    contact?: string;
}

export interface CategoryItem {
    id: string;
    role: string;
    archived: boolean;
    workers: DocumentItem[];
    originalData?: any;
}

export const formatTime = (dateString: string): string => {
    const loadingStore = useLoadingStore();
    const locale = loadingStore.language;

    if (locale === "rs" || locale === "sr") {
        moment.locale('sr');
    } else if (locale === "hu") {
        moment.locale('hu');
    } else if (locale === "en") {
        moment.locale('en');
    }

    return moment(dateString).format("LL");
};

export const getLocalizedCategoryName = (category: any): string => {
    const loadingStore = useLoadingStore();
    const locale = loadingStore.language;

    if (locale === "en") {
        return category.category_name_en || '';
    } else if (locale === "hu") {
        return category.category_name_hu || '';
    } else if (locale === "rs" || locale === "sr") {
        return convertifserbian(category.category_name_rs || '');
    }
    return category.category_name_rs || '';
};

export const getLocalizedDocumentTitle = (document: any): string => {
    const loadingStore = useLoadingStore();
    const locale = loadingStore.language;

    if (locale === "en") {
        return document.document_title_en || document.document_title_hu || '';
    } else if (locale === "hu") {
        return document.document_title_hu || '';
    } else if (locale === "rs" || locale === "sr") {
        return convertifserbian(document.document_title_rs || '');
    }
    return document.document_title_rs || '';
};

export const createNewDocument = async (categoryId: string) => {
    const database = new Databases(appw);
    return await database.createDocument(
        config.website_db,
        config.documents_db,
        ID.unique(),
        { "documentCategories": categoryId }
    );
};

export const archiveCategory = async (categoryId: string, archived: boolean = true) => {
    const database = new Databases(appw);
    return await database.updateDocument(
        config.website_db,
        config.document_categories_db,
        categoryId,
        { "archived": archived }
    );
};

export const loadDocumentsForCategory = async (categoryId: string): Promise<DocumentItem[]> => {
    try {
        const database = new Databases(appw);
        const documentsResponse = await database.listDocuments(
            config.website_db,
            config.documents_db,
            [
                Query.equal("documentCategories", [categoryId]),
                Query.orderDesc("$createdAt")
            ]
        );

        return documentsResponse.documents.map(doc => ({
            id: doc.$id,
            doc_id: doc.document_id || '',
            name: getLocalizedDocumentTitle(doc),
            date: doc.$createdAt,
            contact: doc.contact || ''
        }));
    } catch (error) {
        console.error('Error loading documents for category:', categoryId, error);
        return [];
    }
};

export const loadCategoriesWithDocuments = async (showArchived: boolean = false): Promise<CategoryItem[]> => {
    try {
        const database = new Databases(appw);
        const categories: CategoryItem[] = [];

        // Load active categories
        const activeCategories = await database.listDocuments(
            config.website_db,
            config.document_categories_db,
            [Query.orderAsc("listasorrend"), Query.equal("archived", false)]
        );

        // Process active categories
        for (const category of activeCategories.documents) {
            const documents = await loadDocumentsForCategory(category.$id);
            const categoryName = getLocalizedCategoryName(category);

            categories.push({
                id: category.$id,
                role: categoryName,
                archived: false,
                workers: documents,
                originalData: category
            });
        }

        // Load archived categories if requested
        if (showArchived) {
            const archivedCategories = await database.listDocuments(
                config.website_db,
                config.document_categories_db,
                [Query.orderAsc("listasorrend"), Query.equal("archived", true)]
            );

            for (const category of archivedCategories.documents) {
                const documents = await loadDocumentsForCategory(category.$id);
                let categoryName = getLocalizedCategoryName(category);
                // Note: This should use i18n for proper internationalization

                categories.push({
                    id: category.$id,
                    role: categoryName,
                    archived: true,
                    workers: documents,
                    originalData: category
                });
            }
        }

        return categories;
    } catch (error) {
        console.error('Error loading categories and documents:', error);
        return [];
    }
};