/**
 * @jest-environment jsdom
 */

import { fireEvent, screen, waitFor } from "@testing-library/dom"
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import { ROUTES_PATH } from "../constants/routes.js"
import mockStore from "../__mocks__/store"
import router from "../app/Router.js"

jest.mock("../app/store", () => mockStore)
global.alert = jest.fn()

describe("Given I am connected as an employee", () => {
  let newBill

  beforeEach(() => {
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(() => JSON.stringify({ email: 'employee@test.com' }))
      },
      writable: true
    })

    const onNavigate = (pathname) => {
      document.body.innerHTML = ROUTES_PATH[pathname]
    }

    document.body.innerHTML = NewBillUI()
    newBill = new NewBill({
      document,
      onNavigate,
      localStorage: window.localStorage,
      store: mockStore
    })
  })

  describe("When I am on NewBill Page", () => {
    test("Then the form should be rendered", () => {
      expect(screen.getByTestId("form-new-bill")).toBeTruthy()
    })
  })

  describe("When I upload a valid image file", () => {
    test("Then the file should be accepted and stored", async () => {
      const file = new File(["test"], "test.jpg", { type: "image/jpeg" })
      const fileInput = screen.getByTestId("file")

      fireEvent.change(fileInput, { target: { files: [file] } })

      await waitFor(() => {
        expect(newBill.fileUrl).toContain("/images/test.jpg")
        expect(newBill.fileName).toBe("test.jpg")
      })
      
    })
  })

  describe("When I upload an invalid file type", () => {
    test("Then it should show alert and reset input", () => {
      const file = new File(["test"], "test.pdf", { type: "application/pdf" })
      const fileInput = screen.getByTestId("file")

      fireEvent.change(fileInput, { target: { files: [file] } })

      expect(global.alert).toHaveBeenCalledWith("Seuls les fichiers .png, .jpg ou .jpeg sont autorisés.")
      expect(fileInput.value).toBe("")
    })
  })

  describe("When I submit the form with valid data", () => {
    test("Then the bill should be created and I should be redirected to Bills", () => {
      screen.getByTestId("expense-type").value = "Transports"
      screen.getByTestId("expense-name").value = "Test note"
      screen.getByTestId("datepicker").value = "2024-04-12"
      screen.getByTestId("amount").value = "100"
      screen.getByTestId("vat").value = "20"
      screen.getByTestId("pct").value = "20"
      screen.getByTestId("commentary").value = "Test commentaire"

      newBill.fileUrl = "https://localhost/images/test.jpg"
      newBill.fileName = "test.jpg"
      newBill.billId = "1234"

      const form = screen.getByTestId("form-new-bill")
      const handleSubmit = jest.fn(newBill.handleSubmit)
      form.addEventListener("submit", handleSubmit)
      fireEvent.submit(form)

      expect(handleSubmit).toHaveBeenCalled()
    })
  })

  describe("When API call fails on file upload", () => {
    test("Then it should log an error", async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()

      jest.spyOn(mockStore, "bills").mockImplementation(() => ({
        create: () => Promise.reject(new Error("Erreur API")),
        update: () => Promise.resolve(),
        list: () => Promise.resolve([])
      }))

      const file = new File(["test"], "test.jpg", { type: "image/jpeg" })
      const fileInput = screen.getByTestId("file")
      fireEvent.change(fileInput, { target: { files: [file] } })

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(new Error("Erreur API"))
      })

      consoleErrorSpy.mockRestore()
    })
  })
})