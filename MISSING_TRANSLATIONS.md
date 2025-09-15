# Missing Translations Report

## Summary
After reviewing the language files, I found that several keys are missing from the English (en.json) and Serbian (rs.json) files compared to the Hungarian (hu.json) file.

## Missing Keys in English (en.json)

The following keys exist in Hungarian but are missing or incomplete in English:

1. **joinus** - "ENROLL NOW"
2. **last_update** - "Last update"
3. **loading_data** - "Loading data..."
4. **members_heading** - "Student Parliament Members"
5. **members_subheading** - "List of all representatives"
6. **unknown** - "Unknown"
7. **no_parliament_members_found** - "No student parliament members found"
8. **no_members_paragraph** - "Student parliament representatives are not yet registered in the system."
9. **reload** - "Reload"
10. **error_loading_data** - "Error loading data"
11. **role.president** - "President"
12. **role.vice_president** - "Vice President"
13. **role.secretary** - "Secretary"
14. **role.treasurer** - "Treasurer"
15. **role.member** - "Member"
16. **file_still_uploading** - "File is still uploading"
17. **parentsclub** - "Parents' Council"
18. **add_new_slide** - "Add new slide"
19. **edit_slide** - "Edit slide"
20. **order** - "Order"
21. **title** - "Title"
22. **presentation_editor** - "Presentation editor"
23. **show_date** - "Show date"
24. **yt_video** - "Youtube video:"
25. **noevents** - "No events in database"
26. **events** - "Events"
27. **edit_events** - "Edit events"
28. **deleted** - "Deleted."
29. **location** - "Location"
30. **edit_category** - "Edit category"
31. **delete_category** - "Delete category"
32. **role_not_specified** - "Role not specified"
33. **services_subtitle** - "School support services"
34. **new_version_available** - "New version available"
35. **update_app_message** - "Update the app for latest features."
36. **updating** - "Updating..."
37. **later** - "Later"
38. **offline_ready** - "Ready for offline use"
39. **offline_ready_message** - "The app can now be used offline."
40. **cache_cleared** - "Cache cleared"
41. **language_changed** - "Language changed"
42. **refresh_required** - "Refresh required"
43. **hu** - "Enable Hungarian language"
44. **add_video** - "Add Youtube video"
45. **add_document_store** - "Add document storage"
46. **add_gallery** - "Add more galleries"
47. **videos** - "Videos"
48. **notNews** - "Not News flag"
49. **fb_share** - "Facebook share"
50. **fb_public** - "Facebook share public?"

## Missing Keys in Serbian (rs.json)

Need to check and add Serbian translations for the same keys that are missing in English, plus ensure all keys have proper Cyrillic translations.

## Complete English Translations to Add

```json
{
  "joinus": "ENROLL NOW",
  "last_update": "Last update",
  "loading_data": "Loading data...",
  "members_heading": "Student Parliament Members",
  "members_subheading": "List of all representatives",
  "unknown": "Unknown",
  "no_parliament_members_found": "No student parliament members found",
  "no_members_paragraph": "Student parliament representatives are not yet registered in the system.",
  "reload": "Reload",
  "error_loading_data": "Error loading data",
  "role.president": "President",
  "role.vice_president": "Vice President",
  "role.secretary": "Secretary",
  "role.treasurer": "Treasurer",
  "role.member": "Member",
  "file_still_uploading": "File is still uploading",
  "parentsclub": "Parents' Council",
  "add_new_slide": "Add new slide",
  "edit_slide": "Edit slide",
  "order": "Order",
  "title": "Title",
  "presentation_editor": "Presentation editor",
  "show_date": "Show date",
  "yt_video": "Youtube video:",
  "noevents": "No events in database",
  "events": "Events",
  "edit_events": "Edit events",
  "deleted": "Deleted.",
  "location": "Location",
  "edit_category": "Edit category",
  "delete_category": "Delete category",
  "role_not_specified": "Role not specified",
  "services_subtitle": "School support services",
  "new_version_available": "New version available",
  "update_app_message": "Update the app for latest features.",
  "updating": "Updating...",
  "later": "Later",
  "offline_ready": "Ready for offline use",
  "offline_ready_message": "The app can now be used offline.",
  "cache_cleared": "Cache cleared",
  "language_changed": "Language changed",
  "refresh_required": "Refresh required",
  "hu": "Enable Hungarian language",
  "add_video": "Add Youtube video",
  "add_document_store": "Add document storage",
  "add_gallery": "Add more galleries",
  "videos": "Videos",
  "notNews": "Not News flag",
  "fb_share": "Facebook share",
  "fb_public": "Facebook share public?"
}
```

## Complete Serbian Translations to Add

```json
{
  "joinus": "УПИШИ СЕ",
  "last_update": "Последње ажурирање",
  "loading_data": "Учитавање података...",
  "members_heading": "Чланови ученичког парламента",
  "members_subheading": "Списак свих представника",
  "unknown": "Непознато",
  "no_parliament_members_found": "Нису пронађени чланови ученичког парламента",
  "no_members_paragraph": "Представници ученичког парламента још нису регистровани у систему.",
  "reload": "Поново учитај",
  "error_loading_data": "Грешка при учитавању података",
  "role.president": "Председник",
  "role.vice_president": "Потпредседник",
  "role.secretary": "Секретар",
  "role.treasurer": "Благајник",
  "role.member": "Члан",
  "file_still_uploading": "Фајл се још увек поставља",
  "parentsclub": "Савет родитеља",
  "add_new_slide": "Додај нови слајд",
  "edit_slide": "Измени слајд",
  "order": "Редослед",
  "title": "Наслов",
  "presentation_editor": "Уређивач презентације",
  "show_date": "Прикажи датум",
  "yt_video": "YouTube видео:",
  "noevents": "Нема догађаја у бази",
  "events": "Догађаји",
  "edit_events": "Измени догађаје",
  "deleted": "Обрисано.",
  "location": "Локација",
  "edit_category": "Измени категорију",
  "delete_category": "Обриши категорију",
  "role_not_specified": "Улога није наведена",
  "services_subtitle": "Школске службе подршке",
  "new_version_available": "Доступна је нова верзија",
  "update_app_message": "Ажурирајте апликацију за најновије функције.",
  "updating": "Ажурирање...",
  "later": "Касније",
  "offline_ready": "Спремно за рад ван мреже",
  "offline_ready_message": "Апликација сада може да се користи ван мреже.",
  "cache_cleared": "Кеш је обрисан",
  "language_changed": "Језик је промењен",
  "refresh_required": "Потребно је освежавање",
  "hu": "Омогући мађарски језик",
  "add_video": "Додај YouTube видео",
  "add_document_store": "Додај складиште докумената",
  "add_gallery": "Додај више галерија",
  "videos": "Видео записи",
  "notNews": "Није вест",
  "fb_share": "Facebook дељење",
  "fb_public": "Facebook дељење јавно?"
}
```

## Action Required

1. **Manual Update**: The language files need to be manually updated with these missing translations
2. **Consistency Check**: Ensure all three language files have the same keys
3. **Testing**: After updating, test all UI elements to ensure translations display correctly
4. **Cyrillic Conversion**: The Serbian translations use the automatic Cyrillic converter, so Latin text may also work

## Files to Update

- `/src/lang/en.json` - Add missing English translations
- `/src/lang/rs.json` - Add missing Serbian translations
- `/src/lang/hu.json` - Already complete, use as reference

## Note

The `sb_subtitle` and `services_subtitle` keys appear to be empty in some languages - these should be filled with appropriate descriptions for:
- School Board subtitle
- Services subtitle