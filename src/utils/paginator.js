export const getPaginator = (pageNumber, pageSize) => {
  if (pageNumber < 1) {
    pageNumber = 1
  }
  return {
    limit: pageSize,
    offset: (pageNumber - 1) * pageSize
  }
}
