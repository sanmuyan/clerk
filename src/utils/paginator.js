export const getPaginator = (pageNumber, pageSize) => {
  if (!pageSize) {
    pageSize = 10
  }
  if (!pageNumber) {
    pageNumber = 1
  }
  if (pageNumber < 1) {
    pageNumber = 1
  }
  return {
    limit: pageSize,
    offset: (pageNumber - 1) * pageSize
  }
}
