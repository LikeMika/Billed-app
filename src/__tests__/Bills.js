/**
 * @jest-environment jsdom
 */

import {screen, waitFor} from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import Bills  from "../containers/Bills.js"
import { ROUTES_PATH} from "../constants/routes.js";
import {localStorageMock} from "../__mocks__/localStorage.js";
import router from "../app/Router.js";
import userEvent from "@testing-library/user-event";
import mockStore from "../__mocks__/store";

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')
      expect(windowIcon.className).toEqual('active-icon')

    })
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })

    
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })

    test("Then action button to add a Bill should be visible", async () => {
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('btn-new-bill'))
      const addBillButton = screen.getByTestId('btn-new-bill')
      expect(addBillButton).toHaveRole('button')
    })

    test("Then clicking on new bill button should navigate to NewBill page", () => {
      const onNavigate = jest.fn()
      const billsPage = new Bills({ document, onNavigate, localStorage: window.localStorage, store: mockStore })

      document.body.innerHTML = BillsUI({ data: bills })
      const button = screen.getByTestId("btn-new-bill")
      button.addEventListener("click", billsPage.handleClickNewBill)
      userEvent.click(button)
      expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH['NewBill'])
    })

    test("Then clicking on eye icon should open the modal with image", () => {
      const onNavigate = jest.fn()
      document.body.innerHTML = BillsUI({ data: bills })
      const billsContainer = new Bills({ document, onNavigate, localStorage: window.localStorage, store: mockStore })
      $.fn.modal = jest.fn()
      const eyeIcon = screen.getAllByTestId("icon-eye")[0]
      userEvent.click(eyeIcon)
      expect($.fn.modal).toHaveBeenCalledWith('show')
      expect(document.querySelector(".modal-body").innerHTML).toContain("img")
    })

    test("Then getBills() should log the correct bills length", async () => {
      const mockConsole = jest.spyOn(console, "log").mockImplementation(() => {})
      const store = {
        bills: () => ({
          list: () => Promise.resolve([
            { id: "1", date: "2024-01-01", status: "pending" },
            { id: "2", date: "2024-01-02", status: "refused" }
          ])
        })
      }
      const billsInstance = new Bills({ document, onNavigate: jest.fn(), store, localStorage: window.localStorage })
      await billsInstance.getBills()
      expect(mockConsole).toHaveBeenCalledWith("length", 2)
      mockConsole.mockRestore()
    })

    test("Then getBills() should log error if formatDate throws", async () => {
      const mockConsole = jest.spyOn(console, "log").mockImplementation(() => {})
      const invalidDate = "not-a-date"
      const store = {
        bills: () => ({
          list: () => Promise.resolve([
            { id: "1", date: invalidDate, status: "pending" }
          ])
        })
      }
      const billsInstance = new Bills({ document, onNavigate: jest.fn(), store, localStorage: window.localStorage })
      const billsList = await billsInstance.getBills()
      expect(mockConsole).toHaveBeenCalledWith(expect.any(Error), "for", expect.objectContaining({ id: "1" }))
      expect(billsList[0].date).toBe(invalidDate)
      expect(billsList[0].status).toBe("En attente")
      mockConsole.mockRestore()
    })

  })
})

// test d'intégration GET Bills
describe("Given I am a user connected as Employee", () => {
  describe("When I navigate to Bills Page", () => {
    beforeEach(() => {
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem("user", JSON.stringify({ type: "Employee", email: "a@a" }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
    })

    test("fetches bills from mock API GET", async () => {
      window.store = {
        bills: () => ({
          list: () => Promise.resolve([
            {
              id: "1",
              date: "2024-04-01",
              status: "pending",
              type: "Hôtel",
              name: "Facture avril",
              amount: 100,
              fileUrl: "https://example.com/facture.jpg"
            }
          ])
        })
      }
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByText("Mes notes de frais"))
      expect(screen.getByText("Mes notes de frais")).toBeTruthy()
      expect(screen.getByTestId("tbody").children.length).toBeGreaterThan(0)
    })
  })
})
